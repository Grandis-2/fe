import { mockUuid, products, shipmentBatches } from './product'

import type {
  Order,
  OrderEvent,
  PreorderEvent,
  PreorderStatus,
  ShipmentBatch,
} from '../../types'

// 사전예약·주문 목업이 같이 쓰는 메모리 DB. 화면 상태(displayStatus)는 핸들러가 이 원본으로 계산한다.
// 토스 결제창은 페이지를 통째로 이동시켰다가 돌아온다 — 그때 MSW 모듈도 다시 평가되므로, 인증 목업처럼
// localStorage에 실어 새로고침에도 주문·결제창이 남게 한다(saveOrderDb).
// ponytail: 스키마 버전이 없다 — 모양이 바뀌어 꼬이면 localStorage의 nova-order-mock-db를 지운다. 로그인한 사람은 모두 같은 "나"다.

export type PreorderRecord = {
  preorderId: string
  productId: string
  productTitle: string
  optionId: string
  optionTitle: string
  unitPrice: number
  status: PreorderStatus
  queuePosition: number
  createdAt: string
  payableFrom: string | null
  reservedAt: string | null
  version: number
  externalReference: string | null
  // 접수 키 — 같은 키 재전송이면 이 예약을 돌려준다.
  idempotencyKey: string | null
  events: PreorderEvent[]
}

export type OrderRecord = Order & {
  preorderId: string
  events: OrderEvent[]
}

const HOUR = 60 * 60 * 1000
const isoAgo = (ms: number) => new Date(Date.now() - ms).toISOString()

// 순번이 속한 배송 차수.
export const batchFor = (position: number): ShipmentBatch =>
  shipmentBatches.find(
    ({ positionFrom, positionTo }) =>
      position >= positionFrom &&
      (positionTo === null || position <= positionTo),
  ) ?? shipmentBatches[shipmentBatches.length - 1]

type Seed = {
  productNo: number
  variantIndex: number
  status: PreorderStatus
  queuePosition: number
  createdAgoMs: number
  payableAgoMs?: number
  reservedAgoMs?: number
}

// 상태별로 하나씩 — 결제 가능(폴더블 1), 예약 확정(폴더블 2), 취소됨(맥북 프로 14).
// 맥북 프로 14는 취소된 예약이라 대기열을 거쳐 다시 접수할 수 있다(진행 중 예약은 모델마다 하나).
const SEEDS: Seed[] = [
  {
    productNo: 15,
    variantIndex: 1,
    status: 'REGISTERED',
    queuePosition: 312,
    createdAgoMs: 3 * HOUR,
    payableAgoMs: 2 * HOUR,
  },
  {
    productNo: 16,
    variantIndex: 0,
    status: 'RESERVED',
    queuePosition: 87,
    createdAgoMs: 72 * HOUR,
    payableAgoMs: 70 * HOUR,
    reservedAgoMs: 69 * HOUR,
  },
  {
    productNo: 1,
    variantIndex: 3,
    status: 'CANCELED',
    queuePosition: 1042,
    createdAgoMs: 120 * HOUR,
  },
]

const seedPreorders: PreorderRecord[] = SEEDS.map((seed, i) => {
  const product = products[seed.productNo - 1]
  const variant = product.variants[seed.variantIndex]
  const createdAt = isoAgo(seed.createdAgoMs)
  const payableFrom =
    seed.payableAgoMs === undefined ? null : isoAgo(seed.payableAgoMs)
  const reservedAt =
    seed.reservedAgoMs === undefined ? null : isoAgo(seed.reservedAgoMs)
  const events: PreorderEvent[] = [
    {
      eventSequence: 1,
      fromStatus: null,
      toStatus: 'PENDING_SYNC',
      actor: 'USER',
      reason: null,
      createdAt,
    },
  ]
  if (payableFrom)
    events.push({
      eventSequence: 2,
      fromStatus: 'PENDING_SYNC',
      toStatus: 'REGISTERED',
      actor: 'SYSTEM',
      reason: null,
      createdAt: payableFrom,
    })
  if (reservedAt)
    events.push({
      eventSequence: 3,
      fromStatus: 'REGISTERED',
      toStatus: 'RESERVED',
      actor: 'SYSTEM',
      reason: null,
      createdAt: reservedAt,
    })
  if (seed.status === 'CANCELED')
    events.push({
      eventSequence: 2,
      fromStatus: 'PENDING_SYNC',
      toStatus: 'CANCELED',
      actor: 'USER',
      reason: null,
      createdAt: isoAgo(seed.createdAgoMs - HOUR),
    })
  return {
    preorderId: mockUuid(4, 900 + i),
    productId: product.productId,
    productTitle: product.title,
    optionId: variant.variantId,
    optionTitle: variant.title,
    unitPrice: variant.price,
    status: seed.status,
    queuePosition: seed.queuePosition,
    createdAt,
    payableFrom,
    reservedAt,
    version: events.length,
    externalReference: payableFrom ? `EXT-${seed.queuePosition}` : null,
    idempotencyKey: null,
    events,
  }
})

// 예약 확정된 시드 예약의 결제된 주문.
const reserved = seedPreorders.find((it) => it.status === 'RESERVED')

const seedOrders: OrderRecord[] = reserved
  ? [
      {
        orderId: mockUuid(5, 900),
        preorderId: reserved.preorderId,
        status: 'AWAITING_CONFIRMATION',
        source: 'PREORDER',
        totalAmount: reserved.unitPrice,
        items: [
          {
            productId: reserved.productId,
            optionId: reserved.optionId,
            productTitle: reserved.productTitle,
            optionTitle: reserved.optionTitle,
            unitPrice: reserved.unitPrice,
            quantity: 1,
          },
        ],
        shipTo: {
          name: '홍길동',
          phone: '010-1234-5678',
          postalCode: '06236',
          line1: '서울특별시 강남구 테헤란로 152',
          line2: '101호',
        },
        createdAt: reserved.payableFrom ?? reserved.createdAt,
        events: [
          {
            eventSequence: 1,
            fromStatus: null,
            toStatus: 'AWAITING_PAYMENT',
            actor: 'USER',
            reason: null,
            createdAt: reserved.payableFrom ?? reserved.createdAt,
          },
          {
            eventSequence: 2,
            fromStatus: 'AWAITING_PAYMENT',
            toStatus: 'AUTHORIZING',
            actor: 'USER',
            reason: null,
            createdAt: reserved.reservedAt ?? reserved.createdAt,
          },
          {
            eventSequence: 3,
            fromStatus: 'AUTHORIZING',
            toStatus: 'AWAITING_CONFIRMATION',
            actor: 'SYSTEM',
            reason: 'PAYMENT_APPROVED',
            createdAt: reserved.reservedAt ?? reserved.createdAt,
          },
        ],
      },
    ]
  : []

// 결제창 하나(tossOrderId → 주문·금액). 부를 때마다 새로 만들고 35분 뒤 만료된다.
export type PaymentAttemptRecord = {
  orderId: string
  amount: number
  openedAt: number
}

type OrderDb = {
  preorders: PreorderRecord[]
  orders: OrderRecord[]
  attempts: [string, PaymentAttemptRecord][]
}

const DB_KEY = 'nova-order-mock-db'

function loadOrderDb(): OrderDb | null {
  try {
    const raw = localStorage.getItem(DB_KEY)
    return raw ? (JSON.parse(raw) as OrderDb) : null
  } catch {
    return null
  }
}

const saved = loadOrderDb()

export const preorders: PreorderRecord[] = saved?.preorders ?? seedPreorders
export const orders: OrderRecord[] = saved?.orders ?? seedOrders
export const paymentAttempts = new Map<string, PaymentAttemptRecord>(
  saved?.attempts ?? [],
)

// 예약·주문·결제창을 바꾼 핸들러가 부른다.
export function saveOrderDb() {
  try {
    localStorage.setItem(
      DB_KEY,
      JSON.stringify({ preorders, orders, attempts: [...paymentAttempts] }),
    )
  } catch {
    // 저장 공간이 막혀 있으면 메모리로만 동작한다.
  }
}
