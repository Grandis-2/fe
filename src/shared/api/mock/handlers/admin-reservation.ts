import { http } from 'msw'

import { adminProductStore } from '../fixtures/admin-product'
import {
  findReservation,
  mockMembers,
  reservationStore,
} from '../fixtures/admin-reservation'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  AdminStatsResponse,
  Paged,
  ReservationCreateRequest,
  ReservationDetail,
  ReservationFailureCode,
  ReservationMemoRequest,
  ReservationStatus,
  ReservationSummary,
} from '../../types'
import type { RequestHandler } from 'msw'

const notFound = () =>
  fail(404, {
    code: 'RESERVATION_NOT_FOUND',
    message: '대상을 찾을 수 없습니다.',
    retryable: false,
  })

/** 상세에는 목록 전용 필드(overdue 등)가 없어 여기서 파생시킨다 */
function toSummary(detail: ReservationDetail, now: number): ReservationSummary {
  const register = detail.commands.find(
    (command) => command.kind === 'REGISTER',
  )

  return {
    reservationId: detail.reservationId,
    productId: detail.productId,
    productName: detail.productName,
    optionCode: detail.optionCode,
    optionName: detail.optionName,
    quantity: detail.quantity,
    status: detail.status,
    acceptSeq: detail.acceptSeq,
    dispatch: detail.dispatch,
    externalReservationNo: detail.externalReservationNo,
    acceptedAt: detail.acceptedAt,
    deadlineAt: detail.deadlineAt,
    finalizedAt: detail.finalizedAt,
    version: detail.version,
    memberId: detail.memberId,
    runId: detail.runId,
    cleanup: detail.cleanup,
    failureCode: detail.failure?.code ?? null,
    overdue:
      detail.status === 'ACCEPTED' && Date.parse(detail.deadlineAt) < now,
    registerAttemptCount: register?.attemptCount ?? 0,
  }
}

const hasPendingCleanup = (detail: ReservationDetail) =>
  Object.values(detail.cleanup).some((state) => state !== 'NOT_REQUIRED')

/** 같은 회원이 같은 상품에 이미 진행 중인 예약을 들고 있는지 */
const findActiveReservation = (memberId: string, productId: string) =>
  reservationStore.find(
    (item) =>
      item.memberId === memberId &&
      item.productId === productId &&
      (item.status === 'ACCEPTED' || item.status === 'CONFIRMED'),
  )

const countByStatus = (status: ReservationStatus) =>
  reservationStore.filter((item) => item.status === status).length

function buildStats(): AdminStatsResponse {
  const now = Date.now()
  const accepted = reservationStore.filter((item) => item.status === 'ACCEPTED')

  const failedByReason: Partial<Record<ReservationFailureCode, number>> = {}
  for (const item of reservationStore) {
    if (!item.failure) continue
    failedByReason[item.failure.code] =
      (failedByReason[item.failure.code] ?? 0) + 1
  }

  const oldestAcceptedAgeSeconds = accepted.reduce((oldest, item) => {
    const age = Math.floor((now - Date.parse(item.acceptedAt)) / 1000)
    return Math.max(oldest, age)
  }, 0)

  const emptyKind = {
    pendingCount: 0,
    inProgressCount: 0,
    retryingCount: 0,
    deadCount: 0,
  }

  return {
    asOf: new Date(now).toISOString(),
    runId: null,
    queryFailed: false,
    accept: {
      httpRequestCount: reservationStore.length + 120,
      uniqueAcceptedCount: reservationStore.length,
      idempotentReplayCount: 96,
      rejectedByReason: { ACTIVE_RESERVATION_EXISTS: 20, SALE_NOT_OPEN: 4 },
    },
    registration: {
      acceptedBacklogCount: accepted.length,
      oldestAcceptedAgeSeconds,
      overdueAcceptedCount: accepted.filter(
        (item) => Date.parse(item.deadlineAt) < now,
      ).length,
      confirmedCount: countByStatus('CONFIRMED'),
      failedByReason,
    },
    commands: {
      byKind: {
        REGISTER: {
          ...emptyKind,
          inProgressCount: accepted.length,
          deadCount: countByStatus('FAILED'),
        },
        CANCEL_COMPENSATION: emptyKind,
        REFUND: emptyKind,
        NOTIFY: emptyKind,
      },
      leaseReclaimCount: 1,
      pendingCompensationCount:
        reservationStore.filter(hasPendingCleanup).length,
    },
    reconciliation: {
      lastSuccessfulRunAt: new Date(now - 5000).toISOString(),
      lastRunStatus: 'COMPLETED',
      lastTypeCounts: {
        TYPE1_CONFIRMED_MISMATCH: 0,
        TYPE2_GHOST: 0,
        TYPE3_DUPLICATE: 0,
        TYPE4_OVERDUE: 0,
      },
    },
    convergence: {
      acceptedBacklogZero: accepted.length === 0,
      pendingCompensationZero: !reservationStore.some(hasPendingCleanup),
      lastReconciliationClean: true,
      notificationDeadZero: true,
      allChecksPassed: false,
    },
  }
}

export const adminReservationHandlers: RequestHandler[] = [
  http.get(url('/api/v1/admin/stats'), () => ok(buildStats())),

  http.get(url('/api/v1/admin/reservations'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const now = Date.now()

    const status = query.get('status')
    const failureCode = query.get('failureCode')
    const memberId = query.get('memberId')
    const productId = query.get('productId')
    const from = query.get('from')
    const to = query.get('to')
    const overdueOnly = query.get('overdueOnly') === 'true'
    const cleanupPendingOnly = query.get('cleanupPendingOnly') === 'true'

    const matched = reservationStore
      .map((detail) => toSummary(detail, now))
      .filter((item) => {
        if (status && item.status !== status) return false
        if (failureCode && item.failureCode !== failureCode) return false
        if (memberId && item.memberId !== memberId) return false
        if (productId && item.productId !== productId) return false
        if (from && item.acceptedAt < from) return false
        if (to && item.acceptedAt > to) return false
        if (overdueOnly && !item.overdue) return false
        if (
          cleanupPendingOnly &&
          Object.values(item.cleanup).every((state) => state === 'NOT_REQUIRED')
        ) {
          return false
        }
        return true
      })
      // 최근 접수가 위로 온다 — 명세에 정렬 파라미터가 없어 서버 기본값을 가정한다.
      .toSorted((a, b) => b.acceptSeq - a.acceptSeq)

    const page = Number(query.get('page') ?? 0)
    const size = Number(query.get('size') ?? 20)
    const start = page * size

    return ok<Paged<ReservationSummary>>({
      items: matched.slice(start, start + size),
      page,
      size,
      total: matched.length,
      totalPages: Math.max(1, Math.ceil(matched.length / size)),
      hasNext: start + size < matched.length,
    })
  }),

  http.get(url('/api/v1/admin/reservations/:reservationId'), ({ params }) => {
    const detail = findReservation(String(params.reservationId))
    return detail ? ok(detail) : notFound()
  }),

  // ponytail: 아래 다섯 핸들러는 명세에 없는 임시 계약이다. 와이어프레임의
  // '예약 생성 / 재처리 시도 / 강제 종결 / 내부 메모'를 붙이려면 필요해서
  // 기존 명세의 작명 규칙을 따라 임의로 정했다. 실제 계약이 나오면 교체한다.
  http.post(url('/api/v1/admin/reservations'), async ({ request }) => {
    const body = (await request.json()) as ReservationCreateRequest

    const product = adminProductStore.find(
      (item) => item.productId === body.productId,
    )
    if (!product) return notFound()

    const duplicated = findActiveReservation(body.memberId, body.productId)
    if (duplicated) {
      return fail(409, {
        code: 'ACTIVE_RESERVATION_EXISTS',
        message: '이미 진행 중인 예약이 있습니다.',
        retryable: false,
        // 화면이 '어느 예약과 겹쳤는지'를 보여줘야 해서 예약 ID를 함께 내린다.
        violations: [{ field: 'memberId', message: duplicated.reservationId }],
      })
    }

    const variant = product.variants.find(
      (item) => item.optionCode === body.optionCode,
    )
    if (!variant) return notFound()

    const now = new Date()
    const acceptedAt = now.toISOString()
    const reservationId = crypto.randomUUID()

    const created: ReservationDetail = {
      reservationId,
      productId: product.productId,
      productName: product.name,
      optionCode: variant.optionCode,
      optionName: variant.name,
      quantity: body.quantity,
      status: 'ACCEPTED',
      acceptSeq:
        Math.max(0, ...reservationStore.map((item) => item.acceptSeq)) + 1,
      dispatch: null,
      externalReservationNo: null,
      acceptedAt,
      deadlineAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      finalizedAt: null,
      version: 1,
      memberId: body.memberId,
      runId: null,
      cleanup: {
        externalCancel: 'NOT_REQUIRED',
        refund: 'NOT_REQUIRED',
        stockRestore: 'NOT_REQUIRED',
      },
      failure: null,
      cancelable: true,
      payment: null,
      externalKey: `EK-${reservationId.slice(-8)}`,
      memo: body.memo ?? null,
      // 운영자가 대신 접수해도 절차는 회원 신청과 같다 — 주체만 ADMIN으로 남긴다.
      createdByActorType: 'ADMIN',
      createdByActorId: 'admin',
      commands: [],
      stockReservation: null,
      history: [
        {
          historySeq: 0,
          transition: 'T1',
          fromStatus: null,
          toStatus: 'ACCEPTED',
          actorType: 'ADMIN',
          actorId: 'admin',
          reasonCode: null,
          note: body.memo ?? '관리자 대리 접수',
          decidedAt: acceptedAt,
          committedAt: acceptedAt,
        },
      ],
    }
    reservationStore.push(created)

    return ok(created, 201)
  }),

  http.post(
    url('/api/v1/admin/reservations/:reservationId/reprocess'),
    ({ params }) => {
      const detail = findReservation(String(params.reservationId))
      if (!detail) return notFound()
      if (detail.status !== 'FAILED') {
        return fail(409, {
          code: 'RESERVATION_NOT_REPROCESSABLE',
          message: '확정 실패 상태에서만 재처리할 수 있습니다.',
          retryable: false,
        })
      }

      const at = new Date().toISOString()
      detail.status = 'ACCEPTED'
      detail.failure = null
      detail.finalizedAt = null
      detail.version += 1
      for (const command of detail.commands) {
        if (command.kind !== 'REGISTER') continue
        command.status = 'PENDING'
        command.manualReprocessCount += 1
        command.updatedAt = at
      }
      detail.history.push({
        historySeq: detail.history.length,
        transition: 'T6',
        fromStatus: 'FAILED',
        toStatus: 'ACCEPTED',
        actorType: 'ADMIN',
        actorId: 'admin',
        reasonCode: 'MANUAL_REPROCESS',
        note: '재처리 시도',
        decidedAt: at,
        committedAt: at,
      })

      return ok(detail)
    },
  ),

  http.post(
    url('/api/v1/admin/reservations/:reservationId/force-finalize'),
    ({ params }) => {
      const detail = findReservation(String(params.reservationId))
      if (!detail) return notFound()
      if (detail.status !== 'FAILED') {
        return fail(409, {
          code: 'RESERVATION_NOT_REPROCESSABLE',
          message: '확정 실패 상태에서만 강제 종결할 수 있습니다.',
          retryable: false,
        })
      }

      const at = new Date().toISOString()
      detail.status = 'CANCELED'
      detail.finalizedAt = at
      detail.cancelable = false
      detail.version += 1
      detail.cleanup = { ...detail.cleanup, stockRestore: 'PENDING' }
      detail.history.push({
        historySeq: detail.history.length,
        transition: 'T7',
        fromStatus: 'FAILED',
        toStatus: 'CANCELED',
        actorType: 'ADMIN',
        actorId: 'admin',
        reasonCode: 'FORCE_FINALIZE',
        note: '강제 종결',
        decidedAt: at,
        committedAt: at,
      })

      return ok(detail)
    },
  ),

  http.patch(
    url('/api/v1/admin/reservations/:reservationId/memo'),
    async ({ request, params }) => {
      const detail = findReservation(String(params.reservationId))
      if (!detail) return notFound()

      const body = (await request.json()) as ReservationMemoRequest
      detail.memo = body.memo
      return ok(detail)
    },
  ),

  // ponytail: 회원을 이름으로 찾는 API가 명세에 없다. 생성 모달의 '대상 회원'
  // 입력을 만들려면 필요해서 목에만 둔다.
  http.get(url('/api/v1/admin/members'), ({ request }) => {
    const keyword = new URL(request.url).searchParams.get('q')?.trim() ?? ''
    const items = keyword
      ? mockMembers.filter(
          (member) =>
            member.name.includes(keyword) || member.memberId.includes(keyword),
        )
      : mockMembers

    return ok({ items })
  }),
]
