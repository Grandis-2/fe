import { adminProductStore } from './admin-product'

import type {
  PaymentStatus,
  ReservationCleanup,
  ReservationCommand,
  ReservationDetail,
  ReservationFailureCode,
  ReservationHistoryEntry,
  ReservationPayment,
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
// 실제 등록 실패율이 5% 정도라서 16개 중 1개만 FAILED로 둔다 — 과거에 8개 중
// 1개(12.5%)로 두니 화면이 장애 상황처럼 보였다.
const STATUS_CYCLE: ReservationStatus[] = [
  'CONFIRMED',
  'CONFIRMED',
  'CONFIRMED',
  'ACCEPTED',
  'CONFIRMED',
  'CONFIRMED',
  'CANCELED',
  'CONFIRMED',
  'CONFIRMED',
  'ACCEPTED',
  'CONFIRMED',
  'CONFIRMED',
  'FAILED',
  'CONFIRMED',
  'CANCELED',
  'CONFIRMED',
]

// 접수를 재고로 막지 않으므로 STOCK_EXHAUSTED는, 재시도로 끝까지 밀어붙이므로
// DEADLINE_EXCEEDED는 실제로 나오지 않는다. BUSINESS_REJECTED는 무엇을 거절하는
// 건지 확인 중이라 빼 뒀다.
const FAILURE_CYCLE: ReservationFailureCode[] = [
  'RETRY_EXHAUSTED',
  'INTEGRATION_ERROR',
]

// 결제 기한이 24시간이라 그보다 넓게 깔아야 '기한 만료'와 '몇 시간 남음'이 같이 보인다.
const BASE_AT = Date.now() - 30 * 60 * 60 * 1000
const ACCEPT_GAP_MS = 38 * 60 * 1000
const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000

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
  paymentExpired: boolean,
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
      entry(3, 'T4', 'ACCEPTED', 'FAILED', 16, '등록 실패 / DLQ 진입'),
    ]
  }

  if (status === 'CANCELED') {
    const confirmed = entry(
      1,
      'T3',
      'ACCEPTED',
      'CONFIRMED',
      6,
      '외부 등록 성공',
    )
    // 미결제 자동취소는 시스템이, 회원 취소는 회원이 일으킨다. 같은 CANCELED라도
    // 운영 의미가 정반대라서 actorType과 reasonCode로 갈라 둔다.
    if (paymentExpired) {
      return [
        accepted,
        confirmed,
        {
          ...entry(2, 'T5', 'CONFIRMED', 'CANCELED', 24 * 60 * 60, null),
          actorType: 'SYSTEM',
          reasonCode: 'PAYMENT_DEADLINE_EXCEEDED',
          note: '결제 기한 24시간 초과 / 자동 취소',
        },
      ]
    }
    return [
      accepted,
      confirmed,
      {
        ...entry(2, 'T5', 'CONFIRMED', 'CANCELED', 120, null),
        actorType: 'USER',
        reasonCode: 'USER_REQUESTED',
        note: '회원 취소',
      },
    ]
  }

  return [
    accepted,
    entry(1, 'T3', 'ACCEPTED', 'CONFIRMED', 6, '외부 등록 성공'),
  ]
}

/**
 * 예약은 접수되면 일단 확정되지만 24시간 안에 결제해야 하고, 미결제는 자동취소된다.
 * 그래서 결제 상태는 예약 상태와 따로 돌아간다 — 확정이어도 결제 대기일 수 있다.
 */
function buildPayment(
  index: number,
  status: ReservationStatus,
  acceptedAt: string,
  amount: number,
): { payment: ReservationPayment; expired: boolean } {
  const dueAt = new Date(Date.parse(acceptedAt) + PAYMENT_WINDOW_MS)
  const overDue = dueAt.getTime() < Date.now()

  // 취소 건은 절반이 미결제 자동취소, 절반이 결제 후 회원 취소다.
  // STATUS_CYCLE에서 CANCELED가 걸리는 자리가 전부 짝수 인덱스라서 index % 2로
  // 가르면 한쪽만 나온다 — 몇 번째 주기인지로 갈라야 양쪽이 다 보인다.
  const expired =
    status === 'CANCELED' && Math.floor(index / STATUS_CYCLE.length) % 2 === 0
  // 아직 기한이 남았으면 일부는 결제를 미뤄 둔 상태로 둬서 '몇 시간 남음'이 보인다.
  const unpaid = expired || (!overDue && index % 3 === 0)

  const paymentStatus: PaymentStatus = expired
    ? 'EXPIRED'
    : status === 'CANCELED'
      ? 'REFUNDED'
      : unpaid
        ? 'PENDING'
        : 'PAID'

  return {
    expired,
    payment: {
      status: paymentStatus,
      dueAt: dueAt.toISOString(),
      paidAt:
        paymentStatus === 'PAID' || paymentStatus === 'REFUNDED'
          ? new Date(Date.parse(acceptedAt) + 42 * 60 * 1000).toISOString()
          : null,
      amount,
    },
  }
}

function buildReservation(index: number): ReservationDetail {
  const product = adminProductStore[index % adminProductStore.length]
  const member = MEMBERS[index % MEMBERS.length]
  const variant = product.variants[index % product.variants.length]
  const status = STATUS_CYCLE[index % STATUS_CYCLE.length]
  const failureCode =
    status === 'FAILED' ? FAILURE_CYCLE[index % FAILURE_CYCLE.length] : null

  const reservationId = seededId(index)
  const acceptedAt = new Date(BASE_AT + index * ACCEPT_GAP_MS).toISOString()
  // 접수 후 30분 안에 확정되어야 한다.
  const deadlineAt = new Date(
    Date.parse(acceptedAt) + 30 * 60 * 1000,
  ).toISOString()
  const finalized = status !== 'ACCEPTED'
  const { payment, expired } = buildPayment(
    index,
    status,
    acceptedAt,
    variant.price,
  )

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
    payment,
    externalKey: `EK-${reservationId.slice(-8)}`,
    memo: null,
    createdByActorType: 'USER',
    createdByActorId: member.memberId,
    commands: buildCommands(reservationId, status, failureCode, acceptedAt),
    stockReservation: null,
    history: buildHistory(status, acceptedAt, expired),
  }
}

export const reservationStore: ReservationDetail[] = Array.from(
  { length: 48 },
  (_, index) => buildReservation(index),
)

export const findReservation = (reservationId: string) =>
  reservationStore.find((item) => item.reservationId === reservationId)
