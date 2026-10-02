import { http } from 'msw'

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
  ReservationDetail,
  ReservationFailureCode,
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
    payment: detail.payment,
    failureCode: detail.failure?.code ?? null,
    overdue:
      detail.status === 'ACCEPTED' && Date.parse(detail.deadlineAt) < now,
    registerAttemptCount: register?.attemptCount ?? 0,
  }
}

const hasPendingCleanup = (detail: ReservationDetail) =>
  Object.values(detail.cleanup).some((state) => state !== 'NOT_REQUIRED')

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
        // 기한을 넘긴 접수는 자동 재시도가 돌고 있는 중이고(retrying),
        // 재시도가 소진된 건이 DLQ로 떨어져(dead) 관리자 재처리를 기다린다.
        REGISTER: {
          ...emptyKind,
          inProgressCount: accepted.filter(
            (item) => Date.parse(item.deadlineAt) >= now,
          ).length,
          retryingCount: accepted.filter(
            (item) => Date.parse(item.deadlineAt) < now,
          ).length,
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

  // ponytail: 재처리 핸들러는 명세에 없는 임시 계약이다. 와이어프레임의 '재처리
  // 시도'를 붙이려면 필요해서 기존 명세의 작명 규칙을 따라 임의로 정했다.
  http.post(
    url('/api/v1/admin/reservations/:reservationId/reprocess'),
    ({ params }) => {
      const detail = findReservation(String(params.reservationId))
      if (!detail) return notFound()
      if (detail.status !== 'FAILED') {
        return fail(409, {
          code: 'RESERVATION_NOT_REPROCESSABLE',
          message: '등록 실패 상태에서만 재처리할 수 있습니다.',
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

  // ponytail: 회원 이름을 주는 API가 명세에 없다. 예약 응답에 이름이 없어서
  // 표의 '예약자' 열이 memberId를 이름으로 바꾸려면 필요해 목에만 둔다.
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
