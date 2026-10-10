import { http } from 'msw'

import { batchFor, preorders, saveOrderDb } from '../fixtures/preorder'
import { products } from '../fixtures/product'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { isUuid } from '../validate'

import type {
  PreorderAcceptedResponse,
  QueueAdmitted,
  QueueStatusResponse,
  QueueWaiting,
} from '../../types'
import type { RequestHandler } from 'msw'

// ponytail: 메모리 상태라 새로고침하면 줄이 사라진다 — 그러면 조회가 NOT_IN_QUEUE를 주고 앱이 다시 진입한다.
// ponytail: 토큰이 있는지만 본다 — 로그인한 사람은 모두 같은 "나"다. 관리자 토큰 403도 흉내 내지 않는다.

// 목업 줄은 초당 이만큼 줄어든다 — 진입 위치가 15~40이라 10초 안팎이면 입장한다.
const ADMIT_PER_SECOND = 3
const TICKET_LIFETIME_SECONDS = 120
// 입장권은 만료 후 10분까지 같은 접수의 재전송에만 쓸 수 있다.
const REPLAY_WINDOW_SECONDS = 600
// 예상 시간을 모를 때 서버가 주는 값.
const UNKNOWN_ETA = 450

type Entry = {
  productId: string
  queueToken: string
  joinedAt: number
  startPosition: number
  // 진입할 때 내 뒤에 있던 인원 — 시간이 지나면 조금씩 늘어난다.
  startBehind: number
}

type Ticket = {
  productId: string
  // 줄에 섰던 대기 토큰 — 이 토큰으로 조회해야 같은 입장권을 다시 받는다.
  queueToken: string
  value: string
  issuedAt: number
  used: boolean
}

let entries: Entry[] = []
let tickets: Ticket[] = []

const secondsSince = (time: number) => (Date.now() - time) / 1000

const positionOf = (entry: Entry) =>
  entry.startPosition -
  Math.floor(secondsSince(entry.joinedAt) * ADMIT_PER_SECOND)

const ticketExpiresIn = (ticket: Ticket) =>
  Math.ceil(TICKET_LIFETIME_SECONDS - secondsSince(ticket.issuedAt))

// 예상 대기에 따라 다음 조회 간격(Retry-After)을 정한다 — 명세의 구간표를 따른다.
const retryAfterFor = (etaSeconds: number) =>
  etaSeconds < 5 ? 1 : etaSeconds < 30 ? 3 : etaSeconds < 120 ? 10 : 30

// 차례가 오면 입장권을 한 번 발급하고 줄에서 뺀다. 이미 발급했으면 같은 입장권이다.
function admit(entry: Entry): Ticket {
  entries = entries.filter((it) => it !== entry)
  const ticket: Ticket = {
    productId: entry.productId,
    queueToken: entry.queueToken,
    value: `et_${crypto.randomUUID()}`,
    issuedAt: Date.now(),
    used: false,
  }
  tickets = [
    ...tickets.filter((it) => it.productId !== entry.productId),
    ticket,
  ]
  return ticket
}

const liveTicket = (productId: string) =>
  tickets.find(
    (ticket) =>
      ticket.productId === productId &&
      !ticket.used &&
      ticketExpiresIn(ticket) > 0,
  )

const admitted = (ticket: Ticket): QueueAdmitted => ({
  status: 'ADMITTED',
  admissionTicket: ticket.value,
  expiresIn: ticketExpiresIn(ticket),
})

const waiting = (entry: Entry): QueueWaiting => {
  const position = positionOf(entry)
  return {
    status: 'WAITING',
    position,
    etaSeconds: Math.min(
      UNKNOWN_ETA,
      Math.ceil((position - 1) / ADMIT_PER_SECOND),
    ),
  }
}

// WAITING이면 Retry-After 헤더를 붙인다.
function withRetryAfter(response: Response, etaSeconds: number) {
  response.headers.set('Retry-After', String(retryAfterFor(etaSeconds)))
  return response
}

const hasToken = (request: Request) =>
  request.headers.get('Authorization')?.startsWith('Bearer ') === true

const unauthenticated = () =>
  fail(401, { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' })

// 소문자 UUID만 받는다(대문자·숫자 id·공백은 400).
const readProductId = (request: Request) => {
  const productId = new URL(request.url).searchParams.get('productId') ?? ''
  return isUuid(productId) && productId === productId.toLowerCase()
    ? productId
    : null
}

const badProductId = () =>
  fail(400, {
    code: 'VALIDATION_FAILED',
    message: 'productId 가 올바르지 않습니다.',
  })

const productNotFound = () =>
  fail(404, { code: 'PRODUCT_NOT_FOUND', message: '상품을 찾을 수 없습니다.' })

const saleClosed = () =>
  fail(409, { code: 'SALE_CLOSED', message: '사전예약이 마감되었습니다.' })

const ticketInvalid = () =>
  fail(403, {
    code: 'ADMISSION_TICKET_INVALID',
    message: '대기열에 다시 입장해 주세요.',
  })

const accepted = (
  record: (typeof preorders)[number],
  replayed: boolean,
): PreorderAcceptedResponse => ({
  preorderId: record.preorderId,
  status: record.status,
  queuePosition: record.queuePosition,
  shipmentBatch: batchFor(record.queuePosition),
  createdAt: record.createdAt,
  statusUrl: `/api/v1/preorders/${record.preorderId}`,
  replayed,
})

export const waitingroomHandlers: RequestHandler[] = [
  // 진입 — 새로고침이나 재진입으로 다시 불러도 자리는 하나만 잡힌다.
  http.post(url('/api/v1/preorders/queue'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const productId = readProductId(request)
    if (!productId) return badProductId()

    const campaign = products.find((it) => it.productId === productId)?.campaign
    if (!campaign) return productNotFound()
    if (campaign.status === 'BEFORE_OPEN') {
      return fail(409, {
        code: 'SALE_NOT_OPEN',
        message: '아직 예약 오픈 전입니다.',
      })
    }
    if (campaign.status === 'CLOSED') return saleClosed()

    // 이미 입장한 회원은 입장권 수명 안에 같은 입장권을 200으로 받는다.
    const ticket = liveTicket(productId)
    if (ticket) return ok(admitted(ticket))

    // 이미 줄에 선 회원은 기존 자리를 rejoined로 돌려받는다.
    const existing = entries.find((entry) => entry.productId === productId)
    if (existing && positionOf(existing) <= 0)
      return ok(admitted(admit(existing)))

    const entry: Entry = existing ?? {
      productId,
      queueToken: `qt_${crypto.randomUUID()}`,
      joinedAt: Date.now(),
      startPosition: 15 + Math.floor(Math.random() * 26),
      startBehind: 40 + Math.floor(Math.random() * 200),
    }
    if (!existing) entries = [...entries, entry]
    const view = waiting(entry)
    return withRetryAfter(
      ok<QueueWaiting>(
        {
          ...view,
          queueToken: entry.queueToken,
          rejoined: Boolean(existing),
        },
        202,
      ),
      view.etaSeconds,
    )
  }),

  // 조회 — Retry-After초마다 부른다. 무효·만료·다른 상품의 토큰은 오류 대신 CLOSED NOT_IN_QUEUE다.
  http.get(url('/api/v1/preorders/queue'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const productId = readProductId(request)
    if (!productId) return badProductId()
    const queueToken = request.headers.get('Queue-Token')?.trim()
    if (!queueToken) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: 'Queue-Token 헤더가 필요합니다.',
      })
    }

    const product = products.find((it) => it.productId === productId)
    if (!product?.campaign) return productNotFound()
    if (product.campaign.status === 'CLOSED') {
      return ok<QueueStatusResponse>({
        status: 'CLOSED',
        reason: 'SALE_CLOSED',
      })
    }

    // 차례가 온 뒤 다시 조회해도 같은 입장권이다.
    const ticket = liveTicket(productId)
    if (ticket?.queueToken === queueToken)
      return ok<QueueStatusResponse>(admitted(ticket))

    const entry = entries.find(
      (it) => it.productId === productId && it.queueToken === queueToken,
    )
    if (!entry) {
      return ok<QueueStatusResponse>({
        status: 'CLOSED',
        reason: 'NOT_IN_QUEUE',
      })
    }
    if (positionOf(entry) <= 0) {
      return ok<QueueStatusResponse>(admitted(admit(entry)))
    }

    const view = waiting(entry)
    const behind =
      entry.startBehind + Math.floor(secondsSince(entry.joinedAt) / 2)
    return withRetryAfter(
      ok<QueueStatusResponse>({
        ...view,
        totalWaiting: view.position + behind,
        behind,
      }),
      view.etaSeconds,
    )
  }),

  // 접수 — 입장권을 확인하고 preorder로 넘긴다(목업은 여기서 바로 접수한다).
  http.post(url('/api/v1/preorders'), async ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const productId = readProductId(request)
    if (!productId) return badProductId()
    const ticketValue = request.headers.get('X-Admission-Ticket')
    if (!ticketValue) {
      return fail(400, {
        code: 'ADMISSION_TICKET_REQUIRED',
        message: '대기열 입장권이 필요합니다.',
      })
    }

    const ticket = tickets.find(
      (it) => it.value === ticketValue && it.productId === productId,
    )
    if (!ticket || ticketExpiresIn(ticket) <= -REPLAY_WINDOW_SECONDS)
      return ticketInvalid()

    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) {
      return fail(400, {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key 헤더가 필요합니다.',
      })
    }
    if (idempotencyKey.length < 8 || idempotencyKey.length > 64)
      return invalid([
        { field: 'Idempotency-Key', message: '8~64자여야 합니다.' },
      ])

    const body: unknown = await request.json().catch(() => null)
    const { productId: bodyProductId, optionId } =
      body !== null && typeof body === 'object'
        ? (body as Record<string, unknown>)
        : {}

    // 같은 키 재전송이면 기존 예약의 지금 상태를 돌려준다 — 만료 후 10분 안의 입장권도 여기선 통한다.
    const replay = preorders.find((it) => it.idempotencyKey === idempotencyKey)
    if (replay) {
      if (replay.productId !== bodyProductId || replay.optionId !== optionId) {
        return fail(422, {
          code: 'KEY_PAYLOAD_MISMATCH',
          message:
            '이전 요청과 내용이 다릅니다. 새 신청으로 다시 시도해 주세요.',
        })
      }
      const response = ok(accepted(replay, true), 202)
      response.headers.set('X-Idempotent-Replay', 'true')
      return response
    }
    if (ticket.used) {
      const response = fail(409, {
        code: 'ADMISSION_TICKET_USED',
        message: '대기열에 다시 입장해 주세요.',
      })
      response.headers.set('Retry-After', '31')
      return response
    }
    // 새 접수에 만료된 입장권은 거절된다.
    if (ticketExpiresIn(ticket) <= 0) return ticketInvalid()

    const product = products.find((it) => it.productId === productId)
    const option = product?.variants.find(
      (variant) => variant.variantId === optionId,
    )
    const violations = [
      ...(bodyProductId === productId
        ? []
        : [
            {
              field: 'productId',
              message: '쿼리의 productId와 같아야 합니다.',
            },
          ]),
      ...(option?.status === 'ACTIVE'
        ? []
        : [{ field: 'optionId', message: '판매 중인 옵션이 아닙니다.' }]),
    ]
    if (violations.length > 0) return invalid(violations)
    if (!product || !option) return productNotFound()
    if (product.campaign?.status === 'CLOSED') return saleClosed()

    // 진행 중인 예약(취소되지 않은 것)은 회원·모델마다 하나다.
    const active = preorders.find(
      (it) => it.productId === productId && it.status !== 'CANCELED',
    )
    if (active) {
      return fail(409, {
        code: 'ACTIVE_PREORDER_EXISTS',
        message: '이미 접수된 예약이 있습니다.',
      })
    }

    ticket.used = true
    // 순번은 모델마다 1부터 빈틈없이 매긴다 — 목업은 앞사람이 있는 것처럼 1286 뒤에서 시작한다.
    const queuePosition =
      Math.max(
        1286,
        ...preorders
          .filter((it) => it.productId === productId)
          .map((it) => it.queuePosition),
      ) + 1
    const createdAt = new Date().toISOString()
    const record = {
      preorderId: crypto.randomUUID(),
      productId,
      productTitle: product.title,
      optionId: option.variantId,
      optionTitle: option.title,
      unitPrice: option.price,
      status: 'PENDING_SYNC' as const,
      queuePosition,
      createdAt,
      payableFrom: null,
      reservedAt: null,
      version: 1,
      externalReference: null,
      idempotencyKey,
      events: [
        {
          eventSequence: 1,
          fromStatus: null,
          toStatus: 'PENDING_SYNC' as const,
          actor: 'USER' as const,
          reason: null,
          createdAt,
        },
      ],
    }
    preorders.push(record)
    saveOrderDb()
    const result = accepted(record, false)
    const response = ok(result, 202)
    response.headers.set('Location', result.statusUrl)
    return response
  }),
]
