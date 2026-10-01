import { adminProductStore } from './admin-product'

import type {
  ReservationCleanup,
  ReservationCommand,
  ReservationDetail,
  ReservationFailureCode,
  ReservationHistoryEntry,
  ReservationStatus,
} from '../../types'

const MEMBERS = [
  { memberId: 'M-1001', name: '이주현' },
  { memberId: 'M-1002', name: '김태윤' },
  { memberId: 'M-1003', name: '박서연' },
  { memberId: 'M-1004', name: '정하람' },
  { memberId: 'M-1005', name: '최민석' },
]

/** 회원 이름은 예약 응답에 없다 — 생성 모달이 이름으로 찾을 수 있게 목에서만 들고 있다 */
export const mockMembers = MEMBERS

const NOT_REQUIRED: ReservationCleanup = {
  externalCancel: 'NOT_REQUIRED',
  refund: 'NOT_REQUIRED',
  stockRestore: 'NOT_REQUIRED',
}

// 상태를 정해진 비율로 돌려서 카드/탭이 모두 값을 갖게 한다.
const STATUS_CYCLE: ReservationStatus[] = [
  'CONFIRMED',
  'CONFIRMED',
  'ACCEPTED',
  'CONFIRMED',
  'FAILED',
  'CONFIRMED',
  'ACCEPTED',
  'CANCELED',
]

const FAILURE_CYCLE: ReservationFailureCode[] = [
  'RETRY_EXHAUSTED',
  'INTEGRATION_ERROR',
  'STOCK_EXHAUSTED',
  'DEADLINE_EXCEEDED',
  'BUSINESS_REJECTED',
]

const BASE_AT = Date.parse('2026-09-20T12:00:00.000Z')

/** 목이 새로고침돼도 같은 값이 나오도록 인덱스로 UUID를 만든다 */
const seededId = (index: number) =>
  `9f1c2d3e-4a5b-4c7d-8e9f-${String(index).padStart(12, '0')}`

let commandSeq = 100

function buildCommands(
  reservationId: string,
  status: ReservationStatus,
  failureCode: ReservationFailureCode | null,
  createdAt: string,
): ReservationCommand[] {
  const attemptCount = status === 'FAILED' ? 3 : 1
  const commandStatus =
    status === 'FAILED'
      ? 'DEAD'
      : status === 'ACCEPTED'
        ? 'IN_PROGRESS'
        : 'DONE'

  const register: ReservationCommand = {
    commandId: (commandSeq += 1),
    kind: 'REGISTER',
    status: commandStatus,
    reservationId,
    businessKey: `REGISTER:${reservationId}`,
    targetExternalKey: null,
    targetExternalReservationNo: null,
    attemptCount,
    manualReprocessCount: 0,
    nextAttemptAt: null,
    leaseUntil: null,
    leaseOwner: null,
    leaseToken: null,
    reclaimCount: 0,
    lastErrorCode: failureCode,
    lastError: failureCode ? '외부 등록 응답이 없습니다.' : null,
    createdAt,
    updatedAt: createdAt,
  }

  if (status !== 'CANCELED') return [register]

  return [
    register,
    {
      ...register,
      commandId: (commandSeq += 1),
      kind: 'CANCEL_COMPENSATION',
      status: 'DONE',
      businessKey: `CANCEL:${reservationId}`,
      attemptCount: 1,
      lastErrorCode: null,
      lastError: null,
    },
  ]
}

function buildHistory(
  status: ReservationStatus,
  acceptedAt: string,
): ReservationHistoryEntry[] {
  const at = (offsetSeconds: number) =>
    new Date(Date.parse(acceptedAt) + offsetSeconds * 1000).toISOString()

  const entry = (
    historySeq: number,
    transition: string,
    fromStatus: ReservationStatus | null,
    toStatus: ReservationStatus,
    offsetSeconds: number,
    note: string | null = null,
  ): ReservationHistoryEntry => ({
    historySeq,
    transition,
    fromStatus,
    toStatus,
    actorType: 'SYSTEM',
    actorId: null,
    reasonCode: null,
    note,
    decidedAt: at(offsetSeconds),
    committedAt: at(offsetSeconds),
  })

  const accepted = entry(0, 'T1', null, 'ACCEPTED', 0, '접수 완료')
  if (status === 'ACCEPTED') return [accepted]

  if (status === 'FAILED') {
    return [
      accepted,
      entry(1, 'T2', 'ACCEPTED', 'ACCEPTED', 1, '외부 등록 시도 1회 / 실패'),
      entry(
        2,
        'T2',
        'ACCEPTED',
        'ACCEPTED',
        16,
        '외부 등록 시도 3회 / 상한 초과',
      ),
      entry(3, 'T4', 'ACCEPTED', 'FAILED', 16, '확정 실패 / DLQ 진입'),
    ]
  }

  if (status === 'CANCELED') {
    return [
      accepted,
      entry(1, 'T3', 'ACCEPTED', 'CONFIRMED', 6, '외부 등록 성공'),
      entry(2, 'T5', 'CONFIRMED', 'CANCELED', 120, '회원 취소'),
    ]
  }

  return [
    accepted,
    entry(1, 'T3', 'ACCEPTED', 'CONFIRMED', 6, '외부 등록 성공'),
  ]
}

function buildReservation(index: number): ReservationDetail {
  const product = adminProductStore[index % adminProductStore.length]
  const member = MEMBERS[index % MEMBERS.length]
  const variant = product.variants[index % product.variants.length]
  const status = STATUS_CYCLE[index % STATUS_CYCLE.length]
  const failureCode =
    status === 'FAILED' ? FAILURE_CYCLE[index % FAILURE_CYCLE.length] : null

  const reservationId = seededId(index)
  const acceptedAt = new Date(BASE_AT + index * 13_000).toISOString()
  // 접수 후 30분 안에 확정되어야 한다.
  const deadlineAt = new Date(
    Date.parse(acceptedAt) + 30 * 60 * 1000,
  ).toISOString()
  const finalized = status !== 'ACCEPTED'

  return {
    reservationId,
    productId: product.productId,
    productName: product.name,
    optionCode: variant.optionCode,
    optionName: variant.name,
    quantity: 1,
    status,
    acceptSeq: index + 1,
    dispatch: status === 'CONFIRMED' ? Math.floor(index / 5) + 1 : null,
    externalReservationNo:
      status === 'CONFIRMED' ? `EX-${20_000 + index}` : null,
    acceptedAt,
    deadlineAt,
    finalizedAt: finalized
      ? new Date(Date.parse(acceptedAt) + 16_000).toISOString()
      : null,
    version: finalized ? 2 : 1,
    memberId: member.memberId,
    runId: null,
    cleanup:
      status === 'CANCELED'
        ? { ...NOT_REQUIRED, stockRestore: 'PENDING' }
        : NOT_REQUIRED,
    failure: failureCode
      ? {
          code: failureCode,
          message: '외부 등록 응답이 없습니다.',
          occurredAt: new Date(Date.parse(acceptedAt) + 16_000).toISOString(),
        }
      : null,
    cancelable: status === 'ACCEPTED' || status === 'CONFIRMED',
    payment: null,
    externalKey: `EK-${reservationId.slice(-8)}`,
    memo: null,
    createdByActorType: 'USER',
    createdByActorId: member.memberId,
    commands: buildCommands(reservationId, status, failureCode, acceptedAt),
    stockReservation: null,
    history: buildHistory(status, acceptedAt),
  }
}

export const reservationStore: ReservationDetail[] = Array.from(
  { length: 48 },
  (_, index) => buildReservation(index),
)

export const findReservation = (reservationId: string) =>
  reservationStore.find((item) => item.reservationId === reservationId)
