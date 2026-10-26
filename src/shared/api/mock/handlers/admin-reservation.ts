import { http } from 'msw'

import { deadLetterStore } from '../fixtures/admin-dead-letter'
import {
  findReservation,
  reservationStore,
} from '../fixtures/admin-reservation'
import { isOpenScenarioRunning, requeueForReprocess } from '../openScenario'
import { fail, invalid, ok } from '../response'
import { url } from '../url'

import type {
  AdminCancelRequest,
  AdminNoteRequest,
  AdminPreorderDetail,
  AdminPreorderSort,
  AdminPreorderSummary,
  BatchReprocess,
  OffsetPage,
  PreorderStats,
  PreorderStatus,
  ProductStatsPage,
  StatsRates,
  ReprocessBatchRequest,
  SyncJob,
  SyncJobErrorGroup,
  SyncJobListResponse,
  SyncJobSummary,
} from '../../types'
import type { RequestHandler } from 'msw'

const BASE = '/api/v1/admin/preorders'

/** 상세에서 목록 한 줄을 만든다 — 목록은 상세 일부에 REGISTER 작업 상태가 붙는다 */
function toSummary(detail: AdminPreorderDetail): AdminPreorderSummary {
  // 상세에만 있는 필드는 목록 응답에 싣지 않는다 — 목이 곧 응답 계약이다.
  const {
    externalReference: _externalReference,
    cancelable: _cancelable,
    internalNote: _internalNote,
    syncJobs,
    ...summary
  } = detail
  const register = syncJobs.find((job) => job.jobType === 'REGISTER')
  return {
    ...summary,
    registerJobStatus: register?.status ?? null,
    registerSyncJobId: register?.syncJobId ?? null,
  }
}

// 목록 정렬(명세). 값이 같으면 예약 id로 한 번 더 정해 쪽을 넘겨도 겹치지 않는다.
const dueOf = (item: AdminPreorderSummary) =>
  item.status === 'REGISTERED' && item.paymentDueAt
    ? Date.parse(item.paymentDueAt)
    : Infinity
const sorters: Record<
  AdminPreorderSort,
  (a: AdminPreorderSummary, b: AdminPreorderSummary) => number
> = {
  NEWEST: (a, b) =>
    b.createdAt.localeCompare(a.createdAt) ||
    b.preorderId.localeCompare(a.preorderId),
  OLDEST: (a, b) =>
    a.createdAt.localeCompare(b.createdAt) ||
    a.preorderId.localeCompare(b.preorderId),
  QUEUE_POSITION: (a, b) =>
    a.queuePosition - b.queuePosition ||
    a.preorderId.localeCompare(b.preorderId),
  PAYMENT_DUE: (a, b) =>
    dueOf(a) - dueOf(b) || a.preorderId.localeCompare(b.preorderId),
}

/** 외부 등록을 기다리는 예약 중 REGISTER 작업이 조건에 맞는 것의 가장 오래된 접수 시각 */
const oldestReceived = (
  details: AdminPreorderDetail[],
  matches: (job: SyncJob) => boolean,
) =>
  details
    .filter(
      (detail) =>
        detail.status === 'PENDING_SYNC' &&
        detail.syncJobs.some(
          (job) => job.jobType === 'REGISTER' && matches(job),
        ),
    )
    .map((detail) => detail.createdAt)
    .toSorted()[0] ?? null

const OPEN_JOB_STATES = [
  'PENDING',
  'PROCESSING',
  'RETRY_SCHEDULED',
  'DEAD_LETTER',
] as const

// 상품을 고르면 그 상품 예약에 묶인 메시지만 센다.
function countWaiting(preorderIds: ReadonlySet<string> | null) {
  const waiting = deadLetterStore.filter(
    (item) =>
      item.status === 'OPEN' &&
      (!preorderIds || (item.preorderId && preorderIds.has(item.preorderId))),
  )
  return {
    waiting: waiting.length,
    oldestWaitingAt:
      waiting.map((item) => item.createdAt).toSorted()[0] ?? null,
  }
}

// 서버처럼 10초마다 남긴 기록의 최근 1분으로 속도를 잰다(집계를 부를 때 따라잡는다).
const STEP_MS = 10_000
const RATE_WINDOW_MS = 60_000
type StatsLogEntry = { at: number; received: number; pendingSync: number }
const statsLog = new Map<string, StatsLogEntry[]>()

function ratesOf(key: string, entry: StatsLogEntry): StatsRates | null {
  const log = statsLog.get(key) ?? []
  if (!log.length || entry.at - log.at(-1)!.at >= STEP_MS) log.push(entry)
  while (entry.at - log[0].at > RATE_WINDOW_MS) log.shift()
  statsLog.set(key, log)
  const first = log[0]
  const last = log.at(-1)!
  const seconds = (last.at - first.at) / 1000
  if (seconds <= 0) return null
  const received = last.received - first.received
  const backlog = last.pendingSync - first.pendingSync
  return {
    receivedPerSec: received / seconds,
    registeredPerSec: Math.max(0, received - backlog) / seconds,
    backlogPerMin: (backlog / seconds) * 60,
    windowSeconds: Math.round(seconds),
  }
}

function countStats(productId: string | null): PreorderStats {
  const matched = reservationStore.filter(
    (detail) => !productId || detail.productId === productId,
  )
  const preorders: Record<PreorderStatus, number> = {
    PENDING_SYNC: 0,
    REGISTERED: 0,
    RESERVED: 0,
    CANCELING: 0,
    CANCELED: 0,
  }
  for (const detail of matched) preorders[detail.status] += 1

  const jobs = matched.flatMap((detail) => detail.syncJobs)
  const countJobs = (jobType: SyncJobSummary['jobType']) =>
    Object.fromEntries(
      OPEN_JOB_STATES.map((state) => [
        state,
        jobs.filter((job) => job.jobType === jobType && job.status === state)
          .length,
      ]),
    ) as PreorderStats['syncJobs']['REGISTER']

  return {
    productId,
    preorders,
    syncJobs: { REGISTER: countJobs('REGISTER'), CANCEL: countJobs('CANCEL') },
    deadLetters: countWaiting(
      productId ? new Set(matched.map((detail) => detail.preorderId)) : null,
    ),
    paymentOverdue: matched.filter(
      (detail) => detail.displayStatus === 'PAYMENT_EXPIRED',
    ).length,
    // 명세: 앞의 것은 재처리 필요(DEAD_LETTER)까지, 뒤의 것은 등록 작업이 아직 도는 것만 센다.
    oldestPendingSyncAt: oldestReceived(matched, () => true),
    oldestInFlightSyncAt: oldestReceived(
      matched,
      (job) => job.status !== 'DEAD_LETTER',
    ),
    rates: ratesOf(productId ?? '', {
      at: Date.now(),
      received: Object.values(preorders).reduce((sum, n) => sum + n, 0),
      pendingSync: preorders.PENDING_SYNC,
    }),
    countedAt: new Date().toISOString(),
  }
}

/** 마지막 시도 오류 코드별 작업 수(많은 순) */
function groupByError(jobs: SyncJobSummary[]): SyncJobErrorGroup[] {
  const counts = new Map<string | null, number>()
  for (const job of jobs) {
    counts.set(job.lastErrorCode, (counts.get(job.lastErrorCode) ?? 0) + 1)
  }
  return [...counts]
    .map(([errorCode, count]) => ({ errorCode, count }))
    .toSorted((a, b) => b.count - a.count)
}

/**
 * DEAD_LETTER 작업을 되돌린다. 실서버는 다시 등록을 보내는데, 목은 결과를 기다리지
 * 않고 바로 등록된 것으로 둔다. 외부 예약 대조 목의 재처리도 쓴다.
 */
export function markReprocessed(detail: AdminPreorderDetail, job: SyncJob) {
  const at = new Date().toISOString()
  job.attempts.push({
    attemptNumber: job.attempts.length + 1,
    actor: 'ADMIN',
    result: 'SUCCEEDED',
    httpStatus: 200,
    errorCode: null,
    errorMessage: null,
    startedAt: at,
    finishedAt: at,
  })
  Object.assign(job, {
    status: 'SUCCEEDED',
    attemptCount: job.attempts.length,
    lastErrorCode: null,
    deadLetteredAt: null,
    updatedAt: at,
  })
  detail.events.push({
    eventSequence: detail.events.length + 1,
    fromStatus: 'PENDING_SYNC',
    toStatus: 'REGISTERED',
    actor: 'SYSTEM',
    reason: null,
    createdAt: at,
  })
  Object.assign(detail, {
    status: 'REGISTERED',
    displayStatus: 'PAYABLE',
    payableFrom: at,
    paymentDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    externalReference: `R-${detail.preorderId.slice(-6)}`,
    version: detail.version + 1,
  })
}

/**
 * 관리자 취소. 목은 외부 취소를 기다리지 않고 바로 끝낸다. 외부 예약 대조 목의 예약 취소도
 * 쓴다. 이미 취소 중·완료면 그대로 둔다.
 */
export function markCanceled(detail: AdminPreorderDetail, reason: string) {
  if (detail.status === 'CANCELING' || detail.status === 'CANCELED') return
  detail.events.push({
    eventSequence: detail.events.length + 1,
    fromStatus: detail.status,
    toStatus: 'CANCELED',
    actor: 'ADMIN',
    reason,
    createdAt: new Date().toISOString(),
  })
  Object.assign(detail, {
    status: 'CANCELED',
    displayStatus: 'CANCELED',
    paymentDueAt: null,
    cancelable: false,
    version: detail.version + 1,
  })
}

export const adminReservationHandlers: RequestHandler[] = [
  http.get(url(BASE), ({ request }) => {
    const query = new URL(request.url).searchParams
    const status = query.get('status')
    const productId = query.get('productId')
    const registerJobStatus = query.get('registerJobStatus')
    const batchNumber = query.get('batchNumber')
    const externalReference = query.get('externalReference')?.trim()
    const from = query.get('from')
    const size = Number(query.get('size') ?? 20)
    if (!Number.isInteger(size) || size < 1 || size > 100) {
      return invalid([{ field: 'size', message: '1~100이어야 합니다.' }])
    }
    const page = Number(query.get('page') ?? 0)
    const sort = (query.get('sort') ?? 'NEWEST') as AdminPreorderSort
    if (!(sort in sorters)) {
      return invalid([{ field: 'sort', message: '알 수 없는 정렬입니다.' }])
    }
    if (sort === 'QUEUE_POSITION' && !productId) {
      return invalid([
        { field: 'productId', message: '순번순은 상품을 골라야 합니다.' },
      ])
    }

    const matched = reservationStore
      .filter(
        (detail) =>
          !externalReference || detail.externalReference === externalReference,
      )
      .map(toSummary)
      .filter(
        (item) =>
          (!status || item.status === status) &&
          (!productId || item.productId === productId) &&
          (!registerJobStatus ||
            item.registerJobStatus === registerJobStatus) &&
          (!batchNumber ||
            item.shipmentBatch.batchNumber === Number(batchNumber)) &&
          (!from || Date.parse(item.createdAt) >= Date.parse(from)),
      )
      .toSorted(sorters[sort])

    const start = page * size
    return ok<OffsetPage<AdminPreorderSummary>>({
      items: matched.slice(start, start + size),
      page,
      size,
      total: matched.length,
    })
  }),

  // sync-jobs·stats는 경로 :preorderId보다 먼저 잡혀야 한다.
  http.get(url(`${BASE}/sync-jobs`), ({ request }) => {
    const query = new URL(request.url).searchParams
    const size = Number(query.get('size') ?? 20)
    if (!Number.isInteger(size) || size < 1 || size > 100) {
      return invalid([{ field: 'size', message: '1~100이어야 합니다.' }])
    }
    const page = Number(query.get('page') ?? 0)
    const matched = reservationStore
      .flatMap((detail) => detail.syncJobs)
      .filter(
        (job) =>
          (!query.get('jobType') || job.jobType === query.get('jobType')) &&
          (!query.get('status') || job.status === query.get('status')) &&
          (!query.get('preorderId') ||
            job.preorderId === query.get('preorderId')),
      )
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ attempts: _attempts, ...summary }) => summary)

    const start = page * size
    return ok<SyncJobListResponse>({
      items: matched.slice(start, start + size),
      page,
      size,
      total: matched.length,
      errorGroups:
        query.get('groupByError') === 'true' ? groupByError(matched) : null,
    })
  }),

  http.get(url(`${BASE}/stats`), ({ request }) =>
    ok(countStats(new URL(request.url).searchParams.get('productId'))),
  ),

  // 목의 사전예약은 모두 접수 중이다(대기열 목과 같은 일정) — 마감된 회차는 없다.
  http.get(url(`${BASE}/stats/products`), ({ request }) => {
    const phase = new URL(request.url).searchParams.get('phase')
    if (phase !== 'OPEN' && phase !== 'CLOSED') {
      return invalid([
        { field: 'phase', message: 'OPEN 또는 CLOSED여야 합니다.' },
      ])
    }
    const now = Date.now()
    const ids =
      phase === 'OPEN'
        ? [
            ...new Set(reservationStore.map((item) => item.productId)),
          ].toSorted()
        : []
    return ok<ProductStatsPage>({
      items: ids.map((productId) => {
        const {
          countedAt: _countedAt,
          rates: _rates,
          ...stats
        } = countStats(productId)
        return {
          ...stats,
          productId,
          opensAt: new Date(now - 30 * 60_000).toISOString(),
          closesAt: new Date(now + 90 * 60_000).toISOString(),
        }
      }),
      nextCursor: null,
      countedAt: new Date(now).toISOString(),
    })
  }),

  http.get(url(`${BASE}/:preorderId`), ({ params }) => {
    const detail = findReservation(String(params.preorderId))
    return detail
      ? ok(detail)
      : fail(404, {
          code: 'PREORDER_NOT_FOUND',
          message: '예약을 찾을 수 없습니다.',
        })
  }),

  // 실서버는 대상 수만 주고 초당 ratePerSecond건씩 이어서 하는데, 목은 바로 끝낸다.
  http.post(url(`${BASE}/sync-jobs/reprocess-batch`), async ({ request }) => {
    const body = (await request
      .json()
      .catch(() => null)) as ReprocessBatchRequest | null
    if (!body)
      return invalid([{ field: 'body', message: '본문이 필요합니다.' }])
    const ids = new Set(body.syncJobIds ?? [])
    if (ids.size > 1000) {
      return invalid([{ field: 'syncJobIds', message: '최대 1000건입니다.' }])
    }

    const targets = reservationStore
      .flatMap((detail) =>
        detail.syncJobs
          .filter(
            (job) =>
              job.jobType === 'REGISTER' &&
              job.status === 'DEAD_LETTER' &&
              (ids.size === 0 || ids.has(job.syncJobId)) &&
              (!body.errorCodeFilter ||
                job.lastErrorCode === body.errorCodeFilter) &&
              detail.status !== 'CANCELING' &&
              detail.status !== 'CANCELED',
          )
          .map((job) => [detail, job] as const),
      )
      // 서버처럼 한 번에 1000건까지 — 남은 건 같은 요청을 다시 보내야 한다.
      .slice(0, 1000)
    const rate = body.ratePerSecond ?? 20
    // 오픈 시나리오 중엔 서버처럼 초당 rate건씩 다시 처리하고 일부는 또 실패한다.
    for (const [detail, job] of targets) {
      if (isOpenScenarioRunning()) requeueForReprocess(detail, job, rate)
      else markReprocessed(detail, job)
    }
    return ok<BatchReprocess>(
      {
        targetCount: targets.length,
        skippedCount: ids.size === 0 ? 0 : ids.size - targets.length,
        estimatedSeconds: Math.ceil(targets.length / rate),
      },
      202,
    )
  }),

  // DEAD_LETTER인 REGISTER 작업만 되돌린다.
  http.post(url(`${BASE}/sync-jobs/:syncJobId/reprocess`), ({ params }) => {
    const detail = reservationStore.find((item) =>
      item.syncJobs.some((job) => job.syncJobId === params.syncJobId),
    )
    const job = detail?.syncJobs.find(
      (item) => item.syncJobId === params.syncJobId,
    )
    if (!detail || !job) {
      return fail(404, {
        code: 'SYNC_JOB_NOT_FOUND',
        message: '작업을 찾을 수 없습니다.',
      })
    }
    if (job.status !== 'DEAD_LETTER') {
      return fail(409, {
        code: 'STATE_CONFLICT',
        message: '재처리할 수 없는 작업입니다.',
      })
    }

    markReprocessed(detail, job)
    // 응답은 되돌린 직후의 작업 요약이다(시도 기록 없이).
    const { attempts: _attempts, ...summary } = job
    return ok({ ...summary, status: 'PENDING', deadLetteredAt: null }, 202)
  }),

  // 관리자 취소 — 사유는 이력에 남는다. 목은 외부 취소를 기다리지 않고 바로 끝낸다.
  http.post(url(`${BASE}/:preorderId/cancel`), async ({ request, params }) => {
    const detail = findReservation(String(params.preorderId))
    if (!detail) {
      return fail(404, {
        code: 'PREORDER_NOT_FOUND',
        message: '예약을 찾을 수 없습니다.',
      })
    }
    const body = (await request
      .json()
      .catch(() => null)) as Partial<AdminCancelRequest> | null
    const reason = body?.reason?.trim()
    if (!reason || reason.length < 5 || reason.length > 500) {
      return invalid([{ field: 'reason', message: '5~500자여야 합니다.' }])
    }
    markCanceled(detail, reason)
    return ok(
      {
        preorderId: detail.preorderId,
        status: detail.status,
        version: detail.version,
      },
      202,
    )
  }),

  // 내부 메모만 바꾼다. 다른 키가 섞이면 409(실서버와 같다).
  http.patch(url(`${BASE}/:preorderId`), async ({ request, params }) => {
    const detail = findReservation(String(params.preorderId))
    if (!detail) {
      return fail(404, {
        code: 'PREORDER_NOT_FOUND',
        message: '예약을 찾을 수 없습니다.',
      })
    }
    const body = (await request
      .json()
      .catch(() => null)) as Partial<AdminNoteRequest> | null
    if (!body || Object.keys(body).some((key) => key !== 'internalNote')) {
      return fail(409, {
        code: 'PREORDER_FIELD_IMMUTABLE',
        message: '내부 메모만 바꿀 수 있습니다.',
      })
    }
    const note = body.internalNote ?? null
    if (note !== null && note.length > 1000) {
      return invalid([
        { field: 'internalNote', message: '1000자 이하여야 합니다.' },
      ])
    }
    detail.internalNote = note
    return ok(detail)
  }),
]
