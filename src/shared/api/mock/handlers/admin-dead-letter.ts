import { http } from 'msw'

import {
  deadLetterStore,
  paymentDeadLetterStore,
} from '../fixtures/admin-dead-letter'
import { fail, invalid, ok } from '../response'
import { url } from '../url'

import type {
  BatchRedrive,
  DeadLetterDetail,
  DeadLetterPage,
  DeadLetterSummary,
  DiscardRequest,
  RedriveBatchRequest,
} from '../../types'
import type { RequestHandler } from 'msw'

// 실서버는 큐로 보낸 뒤 처리 결과가 나중에 바뀐다 — 목은 잠깐 뒤 성공으로 바꾼다.
const OUTCOME_DELAY_MS = 2_000

const toSummary = ({
  sourceQueue: _sourceQueue,
  aggregateType: _aggregateType,
  aggregateId: _aggregateId,
  body: _body,
  redriveRequestedBy: _redriveRequestedBy,
  redriveStartedAt: _redriveStartedAt,
  redrivenAt: _redrivenAt,
  outcomeAt: _outcomeAt,
  discardedBy: _discardedBy,
  discardedAt: _discardedAt,
  discardNote: _discardNote,
  ...summary
}: DeadLetterDetail): DeadLetterSummary => summary

const canRedrive = (item: DeadLetterDetail) =>
  item.redrivable &&
  (item.status === 'OPEN' || item.status === 'REDRIVE_FAILED')

function startRedrive(item: DeadLetterDetail) {
  const at = new Date().toISOString()
  Object.assign(item, {
    status: 'REDRIVEN',
    redrivable: false,
    redriveRequestedBy: 'admin',
    redriveStartedAt: at,
    redrivenAt: at,
    updatedAt: at,
  })
  setTimeout(() => {
    const doneAt = new Date().toISOString()
    Object.assign(item, {
      status: 'SUCCEEDED',
      outcomeAt: doneAt,
      updatedAt: doneAt,
    })
  }, OUTCOME_DELAY_MS)
}

// 예약·결제 DLQ는 주소와 저장소만 다르고 동작이 같다.
const deadLetterHandlers = (
  BASE: string,
  store: DeadLetterDetail[],
): RequestHandler[] => {
  const findDeadLetter = (deadLetterId: string) =>
    store.find((item) => item.deadLetterId === deadLetterId)
  return [
    http.get(url(BASE), ({ request }) => {
      const query = new URL(request.url).searchParams
      const size = Number(query.get('size') ?? 20)
      if (!Number.isInteger(size) || size < 1 || size > 100) {
        return invalid([{ field: 'size', message: '1~100이어야 합니다.' }])
      }
      const page = Number(query.get('page') ?? 0)
      const matches =
        (field: keyof DeadLetterDetail) => (item: DeadLetterDetail) =>
          !query.get(field) || item[field] === query.get(field)

      const matched = store
        .filter(matches('status'))
        .filter(matches('eventType'))
        .filter(matches('failureReason'))
        .filter(matches('preorderId'))
        .filter(matches('customerId'))
        .filter(matches('orderId'))
        // 쌓인 시각 [from, to)
        .filter(
          (item) =>
            (!query.get('from') ||
              item.createdAt >= new Date(query.get('from')!).toISOString()) &&
            (!query.get('to') ||
              item.createdAt < new Date(query.get('to')!).toISOString()),
        )
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))

      const start = page * size
      return ok<DeadLetterPage>({
        items: matched.slice(start, start + size).map(toSummary),
        page,
        size,
        total: matched.length,
      })
    }),

    http.post(url(`${BASE}/redrive-batch`), async ({ request }) => {
      const body = (await request
        .json()
        .catch(() => null)) as RedriveBatchRequest | null
      if (!body)
        return invalid([{ field: 'body', message: '본문이 필요합니다.' }])
      const ids = new Set(body.deadLetterIds ?? [])
      if (ids.size > 1000) {
        return invalid([
          { field: 'deadLetterIds', message: '최대 1000건입니다.' },
        ])
      }

      const targets = store.filter((item) =>
        ids.size > 0
          ? ids.has(item.deadLetterId) && canRedrive(item)
          : canRedrive(item) &&
            (!body.eventType || item.eventType === body.eventType) &&
            item.failureReason === (body.failureReason ?? 'PROCESSING_FAILED'),
      )
      targets.forEach(startRedrive)
      const rate = body.ratePerSecond ?? 20
      return ok<BatchRedrive>(
        {
          targetCount: targets.length,
          skippedCount: ids.size === 0 ? 0 : ids.size - targets.length,
          estimatedSeconds: Math.ceil(targets.length / rate),
        },
        202,
      )
    }),

    http.get(url(`${BASE}/:deadLetterId`), ({ params }) => {
      const item = findDeadLetter(String(params.deadLetterId))
      return item
        ? ok(item)
        : fail(404, {
            code: 'DEAD_LETTER_NOT_FOUND',
            message: '메시지를 찾을 수 없습니다.',
          })
    }),

    http.post(url(`${BASE}/:deadLetterId/redrive`), ({ params }) => {
      const item = findDeadLetter(String(params.deadLetterId))
      if (!item) {
        return fail(404, {
          code: 'DEAD_LETTER_NOT_FOUND',
          message: '메시지를 찾을 수 없습니다.',
        })
      }
      if (!canRedrive(item)) {
        return fail(409, {
          code: 'DEAD_LETTER_NOT_REDRIVABLE',
          message: '되돌릴 수 없는 메시지입니다.',
        })
      }
      startRedrive(item)
      return ok(toSummary(item), 202)
    }),

    http.post(
      url(`${BASE}/:deadLetterId/discard`),
      async ({ request, params }) => {
        const item = findDeadLetter(String(params.deadLetterId))
        if (!item) {
          return fail(404, {
            code: 'DEAD_LETTER_NOT_FOUND',
            message: '메시지를 찾을 수 없습니다.',
          })
        }
        const body = (await request
          .json()
          .catch(() => null)) as Partial<DiscardRequest> | null
        const note = body?.note?.trim() ?? ''
        if (note.length === 0 || note.length > 500) {
          return invalid([{ field: 'note', message: '1~500자로 적어 주세요.' }])
        }
        if (item.status !== 'OPEN') {
          return fail(409, {
            code: 'DEAD_LETTER_NOT_DISCARDABLE',
            message: '처리 대기 중인 메시지만 버릴 수 있습니다.',
          })
        }
        const at = new Date().toISOString()
        Object.assign(item, {
          status: 'DISCARDED',
          redrivable: false,
          discardedBy: 'admin',
          discardedAt: at,
          discardNote: note,
          updatedAt: at,
        })
        return ok(item)
      },
    ),
  ]
}

export const adminDeadLetterHandlers: RequestHandler[] = [
  ...deadLetterHandlers(
    '/api/v1/admin/preorders/dead-letters',
    deadLetterStore,
  ),
  ...deadLetterHandlers(
    '/api/v1/admin/orders/payment-dead-letters',
    paymentDeadLetterStore,
  ),
]
