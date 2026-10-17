import { delay, http } from 'msw'

import {
  drawAttempts as attempts,
  drawEntries as entries,
  draws,
  saveDrawDb,
} from '../fixtures/draw'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { isUuid, readPaging, toPage, uuidViolation } from '../validate'

import { CONFIRM_DELAY_MS, shipToViolations, toShipTo } from './order'

import type {
  ApiViolation,
  Draw,
  DrawEntry,
  DrawPhase,
  EntryConfirmResponse,
  EntryPaymentAttempt,
} from '../../types'
import type { DrawEntryRecord, DrawRecord } from '../fixtures/draw'
import type { RequestHandler } from 'msw'

// 토스 승인은 흉내만 낸다 — paymentKey는 무엇이든 승인한다. 추첨은 흉내 내지 않고 시드의 결과만 보여 준다.
// ponytail: 새로 응모한 건 마감이 지나도 result가 null이다(추첨 없음) — 결과 화면은 시드 응모로 본다.

const ATTEMPT_LIFETIME_MS = 35 * 60 * 1000

const hasToken = (request: Request) =>
  request.headers.get('Authorization')?.startsWith('Bearer ') === true

const unauthenticated = () =>
  fail(401, { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' })

const drawNotFound = () =>
  fail(404, { code: 'DRAW_NOT_FOUND', message: '회차를 찾을 수 없습니다.' })

const entryNotFound = () =>
  fail(404, {
    code: 'DRAW_ENTRY_NOT_FOUND',
    message: '응모 내역을 찾을 수 없습니다.',
  })

const notOpen = () =>
  fail(409, {
    code: 'DRAW_NOT_OPEN',
    message: '응모 기간이 아닙니다.',
  })

const notPayable = () =>
  fail(409, {
    code: 'DRAW_ENTRY_NOT_PAYABLE',
    message: '응모비를 결제할 수 있는 상태가 아닙니다.',
  })

// 서버 시각으로 단계를 정한다 — 시작 시각부터 응모 중, 마감 시각부터 마감.
const phaseOf = ({ opensAt, closesAt }: DrawRecord): DrawPhase => {
  const now = Date.now()
  if (now < Date.parse(opensAt)) return 'SCHEDULED'
  return now < Date.parse(closesAt) ? 'OPEN' : 'CLOSED'
}

const toDraw = (draw: DrawRecord): Draw => ({ ...draw, phase: phaseOf(draw) })

const toEntry = (entry: DrawEntryRecord): DrawEntry => ({
  ...entry,
  draw: toDraw(draws.find((it) => it.drawId === entry.drawId) as DrawRecord),
})

const findDraw = (drawId: unknown) => draws.find((it) => it.drawId === drawId)

// 이 탭에서 승인 지연을 기다리는 응모(회차 id). 그사이 새로고침되면 AUTHORIZING만 저장된 채 여기서 빠진다.
const authorizing = new Set<string>()

const findEntry = (drawId: unknown) => {
  const entry = entries.find((it) => it.drawId === drawId)
  // 새로고침으로 끊긴 승인은 실제 서버라면 그사이 끝났다 — 결제된 것으로 마무리한다.
  if (entry?.status === 'AUTHORIZING' && !authorizing.has(entry.drawId)) {
    entry.status = 'PAID'
    saveDrawDb()
  }
  return entry
}

export const drawHandlers: RequestHandler[] = [
  // 회차 목록 — 최신순. 로그인 없이 부를 수 있다.
  http.get(url('/api/v1/draws'), ({ request }) => {
    const { page, size, violations } = readPaging(
      new URL(request.url).searchParams,
    )
    if (violations.length > 0) return invalid(violations)
    const sorted = [...draws].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
    const { items, total } = toPage(sorted, page, size)
    return ok({ items: items.map(toDraw), page, size, total })
  }),

  http.get(url('/api/v1/draws/:drawId'), ({ params }) => {
    if (!isUuid(String(params.drawId)))
      return invalid([uuidViolation('drawId')])
    const draw = findDraw(params.drawId)
    return draw ? ok(toDraw(draw)) : drawNotFound()
  }),

  // 응모하기 — 새 응모는 201(응모비 결제 전), 이미 응모했으면 200으로 기존 응모(새 배송지는 무시).
  http.post(
    url('/api/v1/draws/:drawId/entries'),
    async ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      if (!isUuid(String(params.drawId)))
        return invalid([uuidViolation('drawId')])
      const body: unknown = await request.json().catch(() => null)
      const { shipTo } =
        body !== null && typeof body === 'object'
          ? (body as Record<string, unknown>)
          : {}
      const address =
        shipTo !== null && typeof shipTo === 'object'
          ? (shipTo as Record<string, unknown>)
          : null
      const violations: ApiViolation[] = address
        ? shipToViolations(address)
        : [{ field: 'shipTo', message: '필수 항목입니다.' }]
      if (violations.length > 0) return invalid(violations)

      const draw = findDraw(params.drawId)
      if (!draw) return drawNotFound()
      const existing = findEntry(draw.drawId)
      if (existing) return ok(toEntry(existing))
      if (phaseOf(draw) !== 'OPEN') return notOpen()

      const entry: DrawEntryRecord = {
        entryId: crypto.randomUUID(),
        drawId: draw.drawId,
        status: 'AWAITING_PAYMENT',
        result: null,
        shipTo: toShipTo(address as Record<string, unknown>),
        createdAt: new Date().toISOString(),
      }
      entries.push(entry)
      saveDrawDb()
      return ok(toEntry(entry), 201)
    },
  ),

  http.get(url('/api/v1/draws/:drawId/entries/me'), ({ params, request }) => {
    if (!hasToken(request)) return unauthenticated()
    if (!isUuid(String(params.drawId)))
      return invalid([uuidViolation('drawId')])
    const entry = findEntry(params.drawId)
    return entry ? ok(toEntry(entry)) : entryNotFound()
  }),

  // 응모비 결제 준비 — 돈이 움직이지 않는다. 부를 때마다 새 tossOrderId.
  http.post(
    url('/api/v1/draws/:drawId/entries/me/payment-attempts'),
    ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      if (!isUuid(String(params.drawId)))
        return invalid([uuidViolation('drawId')])
      const draw = findDraw(params.drawId)
      const entry = findEntry(params.drawId)
      if (!draw || !entry) return entryNotFound()
      if (entry.status !== 'AWAITING_PAYMENT') return notPayable()
      if (phaseOf(draw) !== 'OPEN') return notOpen()

      const tossOrderId = crypto.randomUUID()
      attempts.set(tossOrderId, {
        drawId: draw.drawId,
        amount: draw.entryFee,
        openedAt: Date.now(),
      })
      saveDrawDb()
      return ok<EntryPaymentAttempt>(
        { tossOrderId, amount: draw.entryFee, orderName: draw.title },
        201,
      )
    },
  ),

  // 응모비 결제 승인 — successUrl 쿼리 값을 옮겨 보낸다. 결과는 200의 result로 나뉜다.
  http.post(
    url(
      '/api/v1/draws/:drawId/entries/me/payment-attempts/:tossOrderId/confirm',
    ),
    async ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      const tossOrderId = String(params.tossOrderId)
      const body: unknown = await request.json().catch(() => null)
      const { paymentKey, amount } =
        body !== null && typeof body === 'object'
          ? (body as Record<string, unknown>)
          : {}
      const violations: ApiViolation[] = [
        ...(isUuid(String(params.drawId)) ? [] : [uuidViolation('drawId')]),
        ...(/^[A-Za-z0-9_-]{6,64}$/.test(tossOrderId)
          ? []
          : [{ field: 'tossOrderId', message: '형식이 올바르지 않습니다.' }]),
        ...(typeof paymentKey === 'string' &&
        paymentKey !== '' &&
        paymentKey.length <= 200
          ? []
          : [{ field: 'paymentKey', message: '형식이 올바르지 않습니다.' }]),
        ...(Number.isInteger(amount) && (amount as number) > 0
          ? []
          : [{ field: 'amount', message: '양의 정수여야 합니다.' }]),
      ]
      if (violations.length > 0) return invalid(violations)

      const draw = findDraw(params.drawId)
      const entry = findEntry(params.drawId)
      if (!draw || !entry) return entryNotFound()
      // 이미 결제한 응모면 추가 결제 없이 APPROVED — 새로고침해도 안전하다.
      if (entry.status === 'PAID') {
        return ok<EntryConfirmResponse>({
          result: 'APPROVED',
          entryStatus: 'PAID',
          declineReason: null,
        })
      }
      // 승인 중에 같은 승인이 또 들어왔다(타임아웃 뒤 재전송·새로고침) — 이 요청은 승인 전에 거절한다.
      if (entry.status === 'AUTHORIZING') return notPayable()
      const attempt = attempts.get(tossOrderId)
      if (!attempt || attempt.drawId !== draw.drawId) {
        return fail(404, {
          code: 'PAYMENT_ATTEMPT_NOT_FOUND',
          message: '결제 시도를 찾을 수 없습니다.',
        })
      }
      if (amount !== attempt.amount || amount !== draw.entryFee) {
        return fail(409, {
          code: 'PAYMENT_AMOUNT_MISMATCH',
          message: '결제 금액이 응모비와 다릅니다.',
        })
      }
      if (entry.status !== 'AWAITING_PAYMENT') return notPayable()
      // 결제 대기인 응모는 마감 뒤 승인할 수 없다.
      if (phaseOf(draw) !== 'OPEN') return notOpen()

      attempts.delete(tossOrderId)
      // 결제창 유효 시간은 승인을 시작할 때 본다(지연만큼 늦게 재지 않게).
      const expired = Date.now() - attempt.openedAt > ATTEMPT_LIFETIME_MS
      entry.status = 'AUTHORIZING'
      saveDrawDb()
      authorizing.add(entry.drawId)
      await delay(CONFIRM_DELAY_MS)
      authorizing.delete(entry.drawId)
      if (expired) {
        entry.status = 'AWAITING_PAYMENT'
        saveDrawDb()
        return ok<EntryConfirmResponse>({
          result: 'DECLINED',
          entryStatus: 'AWAITING_PAYMENT',
          declineReason: 'PAYMENT_EXPIRED',
        })
      }
      entry.status = 'PAID'
      saveDrawDb()
      return ok<EntryConfirmResponse>({
        result: 'APPROVED',
        entryStatus: 'PAID',
        declineReason: null,
      })
    },
  ),
]
