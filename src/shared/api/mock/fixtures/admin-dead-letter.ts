import { reservationStore } from './admin-reservation'

import type { DeadLetterDetail } from '../../types'

/*
 * 이벤트 DLQ 목. 예약 상세의 '상태 반영 실패'와 개발자 화면에서 상태별로 하나씩 보이도록
 * 우리 예약 목에 묶어 만든다. 실서버에서는 평소 비어 있어야 정상이다.
 */
const HOUR = 60 * 60 * 1000
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString()
const seededId = (index: number) =>
  `d1e2f3a4-4a5b-4c7d-8e9f-${String(index).padStart(12, '0')}`

const registered = reservationStore.filter(
  (item) => item.status === 'REGISTERED',
)
const pending = reservationStore.find(
  (item) =>
    item.status === 'PENDING_SYNC' &&
    item.syncJobs[0]?.status !== 'DEAD_LETTER',
)

type Seed = Partial<DeadLetterDetail> &
  Pick<DeadLetterDetail, 'eventType' | 'failureReason' | 'status'> & {
    hoursAgo: number
    preorder?: (typeof reservationStore)[number]
  }

const seeds: Seed[] = [
  {
    eventType: 'PREORDER_PAYMENT_CONFIRMED',
    failureReason: 'PROCESSING_FAILED',
    status: 'OPEN',
    hoursAgo: 2,
    preorder: registered[0],
  },
  {
    eventType: 'PREORDER_EXPIRY_REQUESTED',
    failureReason: 'PROCESSING_FAILED',
    status: 'OPEN',
    hoursAgo: 5,
    preorder: registered[1],
  },
  {
    eventType: 'EXTERNAL_JOB_SUCCEEDED',
    failureReason: 'PROCESSING_FAILED',
    status: 'REDRIVE_FAILED',
    hoursAgo: 8,
    preorder: pending,
  },
  {
    eventType: 'PREORDER_PRODUCT_CHANGED',
    failureReason: 'PROCESSING_FAILED',
    status: 'OPEN',
    hoursAgo: 12,
  },
  // 원문이 깨져 종류도 모른다 — 되돌려도 또 실패하니 버릴 수밖에 없다.
  {
    eventType: null,
    failureReason: 'UNREADABLE_BODY',
    status: 'OPEN',
    hoursAgo: 20,
    body: '{"eventType":"PREORDER_PAYMENT_CONF',
  },
  {
    eventType: 'PREORDER_PAYMENT_STARTED',
    failureReason: 'PROCESSING_FAILED',
    status: 'SUCCEEDED',
    hoursAgo: 26,
    preorder: registered[2],
    redriveRequestedBy: 'admin',
  },
  {
    eventType: 'PREORDER_GIFT_GRANTED',
    failureReason: 'UNKNOWN_EVENT_TYPE',
    status: 'DISCARDED',
    hoursAgo: 30,
    discardedBy: 'admin',
    discardNote: '아직 받지 않는 이벤트 종류 — 발행 쪽에 확인 후 버림',
  },
]

export const deadLetterStore: DeadLetterDetail[] = seeds.map(
  ({ hoursAgo, preorder, ...seed }, index) => {
    const createdAt = iso(hoursAgo * HOUR)
    const eventId = seed.eventType ? seededId(100 + index) : null
    const done = seed.status === 'SUCCEEDED' || seed.status === 'REDRIVE_FAILED'
    return {
      deadLetterId: seededId(index + 1),
      messageId: `msg-${String(index + 1).padStart(4, '0')}`,
      eventId,
      eventType: seed.eventType,
      preorderId: preorder?.preorderId ?? null,
      customerId: preorder?.customerId ?? null,
      failureReason: seed.failureReason,
      receiveCount: 5,
      status: seed.status,
      redrivable:
        seed.failureReason === 'PROCESSING_FAILED' &&
        (seed.status === 'OPEN' || seed.status === 'REDRIVE_FAILED'),
      redrivenFromId: null,
      sentAt: iso(hoursAgo * HOUR + 60_000),
      updatedAt: createdAt,
      sourceQueue: 'preorder-events',
      aggregateType: preorder ? 'PREORDER' : seed.eventType ? 'PRODUCT' : null,
      aggregateId: preorder?.preorderId ?? null,
      body:
        seed.body ??
        JSON.stringify({
          eventId,
          eventType: seed.eventType,
          preorderId: preorder?.preorderId ?? null,
          occurredAt: createdAt,
        }),
      redriveRequestedBy: seed.redriveRequestedBy ?? null,
      redriveStartedAt: done ? createdAt : null,
      redrivenAt: done ? createdAt : null,
      outcomeAt: done ? createdAt : null,
      discardedBy: seed.discardedBy ?? null,
      discardedAt: seed.discardedBy ? createdAt : null,
      discardNote: seed.discardNote ?? null,
      createdAt,
    }
  },
)

export const findDeadLetter = (deadLetterId: string) =>
  deadLetterStore.find((item) => item.deadLetterId === deadLetterId)
