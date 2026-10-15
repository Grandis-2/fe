import { adminProductStore } from './admin-product'
import { shipmentBatchStore } from './admin-shipment'

import type {
  AdminMember,
  AdminPreorderDetail,
  PreorderDisplayStatus,
  PreorderStatus,
  ShipmentBatch,
  SyncJobStatus,
  SyncJobSummary,
} from '../../types'

/** 예약 응답엔 회원 id만 있어 이름은 회원 이름 조회로 받는다 */
export const mockMembers: AdminMember[] = [
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

  const register: SyncJobSummary = {
    syncJobId: seededId('7b2e3f4a', index),
    preorderId,
    jobType: 'REGISTER',
    status: registerStatus,
    attemptCount: registerStatus === 'SUCCEEDED' ? 1 : 3,
    lastErrorCode: registerStatus === 'SUCCEEDED' ? null : 'HTTP_503',
    deadLetteredAt:
      registerStatus === 'DEAD_LETTER' ? iso(createdAtMs + 60_000) : null,
    createdAt: iso(createdAtMs),
    updatedAt: iso(createdAtMs + 60_000),
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
    internalNote: null,
    syncJobs: [register],
  }
}

// 순번은 상품마다 1부터 빈틈없이 매긴다.
const positions = new Map<string, number>()
export const reservationStore: AdminPreorderDetail[] = Array.from(
  { length: 48 },
  (_, index) => {
    const draft = buildReservation(index, 0)
    const position = (positions.get(draft.productId) ?? 0) + 1
    positions.set(draft.productId, position)
    return buildReservation(index, position)
  },
)

export const findReservation = (preorderId: string) =>
  reservationStore.find((item) => item.preorderId === preorderId)
