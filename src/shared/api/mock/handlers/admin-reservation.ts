import { http } from 'msw'

import { deadLetterStore } from '../fixtures/admin-dead-letter'
import {
  findReservation,
  mockMembers,
  reservationStore,
} from '../fixtures/admin-reservation'
import { isOpenScenarioRunning, requeueForReprocess } from '../openScenario'
import { fail, invalid, ok } from '../response'
import { url } from '../url'

import type {
  AdminCancelRequest,
  AdminNoteRequest,
  AdminPreorderDetail,
  AdminPreorderSummary,
  BatchReprocess,
  OffsetPage,
  PreorderStats,
  PreorderStatus,
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
  return {
    ...summary,
    registerJobStatus:
      syncJobs.find((job) => job.jobType === 'REGISTER')?.status ?? null,
  }
}

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
    // 재처리 필요(DEAD_LETTER)로 멈춘 예약은 빼고 아직 처리 중인 것만 본다.
    // ponytail: 명세가 둘 중 무엇인지 말하지 않아(백엔드 요청서 Q3) 의미상 맞는 쪽으로 가정했다.
    oldestPendingSyncAt:
      matched
        .filter(
          (detail) =>
            detail.status === 'PENDING_SYNC' &&
            detail.syncJobs.some(
              (job) =>
                job.jobType === 'REGISTER' && job.status !== 'DEAD_LETTER',
            ),
        )
        .map((detail) => detail.createdAt)
        .toSorted()[0] ?? null,
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
      // 최신 접수가 위로 온다.
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))

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

  // 보이는 id만 이름으로 바꾼다. 없는 회원은 빠진다(실서버와 같다).
  http.get(url('/api/v1/admin/members'), ({ request }) => {
    const ids = new URL(request.url).searchParams
      .getAll('ids')
      .flatMap((value) => value.split(','))
      .filter(Boolean)
    if (ids.length < 1 || ids.length > 100) {
      return invalid([{ field: 'ids', message: '1~100개여야 합니다.' }])
    }
    // 서버처럼 첫 글자만 남기고 가린다(김철수 → 김**).
    return ok({
      items: mockMembers
        .filter((member) => ids.includes(member.memberId))
        .map((member) => ({ ...member, name: `${[...member.name][0]}**` })),
    })
  }),
]
