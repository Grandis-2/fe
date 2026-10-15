import { http } from 'msw'

import {
  findReservation,
  mockMembers,
  reservationStore,
} from '../fixtures/admin-reservation'
import { fail, invalid, ok } from '../response'
import { url } from '../url'

import type {
  AdminPreorderDetail,
  AdminPreorderSummary,
  OffsetPage,
  PreorderStats,
  PreorderStatus,
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
    paymentOverdue: matched.filter(
      (detail) => detail.displayStatus === 'PAYMENT_EXPIRED',
    ).length,
    countedAt: new Date().toISOString(),
  }
}

export const adminReservationHandlers: RequestHandler[] = [
  http.get(url(BASE), ({ request }) => {
    const query = new URL(request.url).searchParams
    const status = query.get('status')
    const productId = query.get('productId')
    const registerJobStatus = query.get('registerJobStatus')
    const size = Number(query.get('size') ?? 20)
    if (!Number.isInteger(size) || size < 1 || size > 100) {
      return invalid([{ field: 'size', message: '1~100이어야 합니다.' }])
    }
    const page = Number(query.get('page') ?? 0)

    const matched = reservationStore
      .map(toSummary)
      .filter(
        (item) =>
          (!status || item.status === status) &&
          (!productId || item.productId === productId) &&
          (!registerJobStatus || item.registerJobStatus === registerJobStatus),
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

  // 경로 :preorderId보다 먼저 잡혀야 한다.
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

  // DEAD_LETTER인 REGISTER 작업만 되돌린다. 실서버는 다시 등록을 보내는데, 목은 결과를
  // 기다리지 않고 바로 등록된 것으로 둔다.
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

    const at = new Date().toISOString()
    Object.assign(job, {
      status: 'SUCCEEDED',
      attemptCount: job.attemptCount + 1,
      lastErrorCode: null,
      deadLetteredAt: null,
      updatedAt: at,
    })
    Object.assign(detail, {
      status: 'REGISTERED',
      displayStatus: 'PAYABLE',
      payableFrom: at,
      paymentDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      externalReference: `R-${detail.preorderId.slice(-6)}`,
      version: detail.version + 1,
    })
    return ok(
      {
        ...job,
        status: 'PENDING',
        deadLetteredAt: null,
      },
      202,
    )
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
    return ok({
      items: mockMembers.filter((member) => ids.includes(member.memberId)),
    })
  }),
]
