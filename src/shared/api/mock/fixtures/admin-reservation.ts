import { adminProductStore } from './admin-product'
import { shipmentBatchStore } from './admin-shipment'

import type {
  AdminPreorderDetail,
  PreorderDisplayStatus,
  PreorderEvent,
  PreorderStatus,
  ShipmentBatch,
  SyncAttempt,
  SyncJob,
  SyncJobStatus,
} from '../../types'

/** 서버처럼 첫 글자만 남기고 가린다(김철수 → 김**) */
export const maskName = (name: string) => `${[...name][0]}**`

/** 목 회원. 응답엔 이름을 가려(maskName) 싣는다 */
export const mockMembers: { memberId: string; name: string }[] = [
  { memberId: '5d1c2e3f-4a5b-4c6d-8e7f-000000001001', name: '이주현' },
  { memberId: '5d1c2e3f-4a5b-4c6d-8e7f-000000001002', name: '김태윤' },
  { memberId: '5d1c2e3f-4a5b-4c6d-8e7f-000000001003', name: '박서연' },
  { memberId: '5d1c2e3f-4a5b-4c6d-8e7f-000000001004', name: '정하람' },
  { memberId: '5d1c2e3f-4a5b-4c6d-8e7f-000000001005', name: '최민석' },
]

/**
 * 상태를 정해진 비율로 돌려서 카드·탭이 모두 값을 갖게 한다. DEAD는 외부 등록이
 * 재시도까지 다 실패한 처리 중 예약이다 — 실제 실패율이 5% 정도라 16개 중 1개만 둔다.
 */
type Seed =
  | 'PROCESSING'
  | 'DEAD'
  | 'PAYABLE'
  | 'PAYING'
  | 'EXPIRED'
  | 'RESERVED'
  | 'CANCELED'
const SEED_CYCLE: Seed[] = [
  'RESERVED',
  'RESERVED',
  'PAYABLE',
  'PROCESSING',
  'RESERVED',
  'RESERVED',
  'CANCELED',
  'RESERVED',
  'PAYABLE',
  'PROCESSING',
  'RESERVED',
  'PAYING',
  'DEAD',
  'RESERVED',
  'CANCELED',
  'EXPIRED',
]

const STATUS_OF: Record<
  Seed,
  [PreorderStatus, PreorderDisplayStatus, SyncJobStatus]
> = {
  PROCESSING: ['PENDING_SYNC', 'PROCESSING', 'RETRY_SCHEDULED'],
  DEAD: ['PENDING_SYNC', 'PROCESSING', 'DEAD_LETTER'],
  PAYABLE: ['REGISTERED', 'PAYABLE', 'SUCCEEDED'],
  PAYING: ['REGISTERED', 'PAYMENT_IN_PROGRESS', 'SUCCEEDED'],
  EXPIRED: ['REGISTERED', 'PAYMENT_EXPIRED', 'SUCCEEDED'],
  RESERVED: ['RESERVED', 'RESERVED', 'SUCCEEDED'],
  CANCELED: ['CANCELED', 'CANCELED', 'SUCCEEDED'],
}

// 결제 기한이 24시간이라 그보다 넓게 깔아야 '기한 만료'와 '몇 시간 남음'이 같이 보인다.
const BASE_AT = Date.now() - 30 * 60 * 60 * 1000
const ACCEPT_GAP_MS = 38 * 60 * 1000
const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000

/** 목이 새로고침돼도 같은 값이 나오도록 인덱스로 UUID를 만든다 */
const seededId = (prefix: string, index: number) =>
  `${prefix}-4a5b-4c7d-8e9f-${String(index).padStart(12, '0')}`

const iso = (ms: number) => new Date(ms).toISOString()

const FALLBACK_BATCH: ShipmentBatch = {
  batchNumber: 1,
  positionFrom: 1,
  positionTo: null,
  estimatedShipStart: '2026-11-02',
  estimatedShipEnd: '2026-11-06',
}

const batchOf = (productId: string, position: number) =>
  shipmentBatchStore
    .get(productId)
    ?.find(
      (batch) =>
        position >= batch.positionFrom &&
        (batch.positionTo === null || position <= batch.positionTo),
    ) ?? FALLBACK_BATCH

function buildReservation(
  index: number,
  queuePosition: number,
): AdminPreorderDetail {
  const preorderProducts = adminProductStore.filter(
    (product) => product.saleMode === 'PREORDER',
  )
  const product = preorderProducts[index % preorderProducts.length]
  const variant = product.variants[index % product.variants.length]
  const member = mockMembers[index % mockMembers.length]
  const seed = SEED_CYCLE[index % SEED_CYCLE.length]
  const [status, displayStatus, registerStatus] = STATUS_OF[seed]

  const preorderId = seededId('9f1c2d3e', index)
  const createdAtMs = BASE_AT + index * ACCEPT_GAP_MS
  const registered = status !== 'PENDING_SYNC'
  const payableFromMs = createdAtMs + 16_000
  // 아직 결제할 수 있는 건은 기한이 남아 있어야 해서 지금 기준으로 맞춘다.
  const paymentDueMs =
    seed === 'EXPIRED'
      ? Date.now() - 60 * 60 * 1000
      : seed === 'PAYABLE' || seed === 'PAYING'
        ? Date.now() + ((index % 20) + 1) * 60 * 60 * 1000
        : payableFromMs + PAYMENT_WINDOW_MS

  // 성공한 등록은 한 번에, 실패 중인 등록은 503을 세 번 맞은 기록을 둔다.
  const failedTries = registerStatus === 'SUCCEEDED' ? 0 : 3
  const attempts: SyncAttempt[] = Array.from(
    { length: Math.max(1, failedTries) },
    (_, attempt) => ({
      attemptNumber: attempt + 1,
      actor: 'SYSTEM',
      result: failedTries ? 'FAILED' : 'SUCCEEDED',
      httpStatus: failedTries ? 503 : 200,
      errorCode: failedTries ? 'HTTP_503' : null,
      errorMessage: failedTries ? 'Service Unavailable' : null,
      startedAt: iso(createdAtMs + 1_000 + attempt * 20_000),
      finishedAt: iso(createdAtMs + 1_500 + attempt * 20_000),
    }),
  )
  const register: SyncJob = {
    syncJobId: seededId('7b2e3f4a', index),
    preorderId,
    jobType: 'REGISTER',
    status: registerStatus,
    attemptCount: attempts.length,
    lastErrorCode: failedTries ? 'HTTP_503' : null,
    deadLetteredAt:
      registerStatus === 'DEAD_LETTER' ? iso(createdAtMs + 60_000) : null,
    createdAt: iso(createdAtMs),
    updatedAt: iso(createdAtMs + 60_000),
    attempts,
  }

  // 상태가 지나온 길을 이력으로 남긴다: 접수 → 결제 대기 → 확정 / 취소.
  const event = (
    eventSequence: number,
    fromStatus: PreorderStatus | null,
    toStatus: PreorderStatus,
    actor: PreorderEvent['actor'],
    atMs: number,
  ): PreorderEvent => ({
    eventSequence,
    fromStatus,
    toStatus,
    actor,
    reason: null,
    createdAt: iso(atMs),
  })
  const events = [event(1, null, 'PENDING_SYNC', 'USER', createdAtMs)]
  if (registered) {
    events.push(event(2, 'PENDING_SYNC', 'REGISTERED', 'SYSTEM', payableFromMs))
  }
  if (status === 'RESERVED') {
    events.push(
      event(3, 'REGISTERED', 'RESERVED', 'SYSTEM', payableFromMs + 42 * 60_000),
    )
  }
  if (status === 'CANCELED') {
    events.push(
      event(3, 'REGISTERED', 'CANCELING', 'USER', payableFromMs + 60_000),
      event(4, 'CANCELING', 'CANCELED', 'SYSTEM', payableFromMs + 70_000),
    )
  }

  return {
    preorderId,
    productId: product.productId,
    productTitle: product.name,
    optionId: seededId('3c4d5e6f', index),
    optionTitle: variant.name,
    unitPrice: variant.price,
    status,
    displayStatus,
    queuePosition,
    shipmentBatch: batchOf(product.productId, queuePosition),
    createdAt: iso(createdAtMs),
    payableFrom: registered ? iso(payableFromMs) : null,
    paymentDueAt: status === 'REGISTERED' ? iso(paymentDueMs) : null,
    reservedAt: status === 'RESERVED' ? iso(payableFromMs + 42 * 60_000) : null,
    version: registered ? 2 : 1,
    externalReference: registered ? `R-${20_000 + index}` : null,
    cancelable: status !== 'CANCELING' && status !== 'CANCELED',
    customerId: member.memberId,
    customerName: maskName(member.name),
    internalNote:
      index % 7 === 0 ? 'VIP 고객 — 배송 일정 문의 이력 있음' : null,
    syncJobs: [register],
    events,
  }
}

// 순번은 상품마다 1부터 빈틈없이 매긴다. 순번은 입장 순서, 접수 시각은 폼을 다 쓴 시각이라
// 둘의 순서가 어긋난다 — 입장 순서를 접수 순서와 다르게 섞어(7과 48은 서로소) 순번순 정렬이
// 접수순과 달라 보이게 한다.
const RESERVATION_COUNT = 48
const positionOf = new Map<number, number>()
const positions = new Map<string, number>()
for (let step = 0; step < RESERVATION_COUNT; step++) {
  const index = (step * 7) % RESERVATION_COUNT
  const { productId } = buildReservation(index, 0)
  const position = (positions.get(productId) ?? 0) + 1
  positions.set(productId, position)
  positionOf.set(index, position)
}
export const reservationStore: AdminPreorderDetail[] = Array.from(
  { length: RESERVATION_COUNT },
  (_, index) => buildReservation(index, positionOf.get(index)!),
)

export const findReservation = (preorderId: string) =>
  reservationStore.find((item) => item.preorderId === preorderId)
