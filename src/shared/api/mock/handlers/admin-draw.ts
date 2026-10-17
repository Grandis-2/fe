import { http } from 'msw'

import {
  DRAW_REQUEST_DELAY_MS,
  DRAW_SETTLE_DELAY_MS,
  memberEntryCounts,
  settleDueDraws,
} from '../drawSettlement'
import { adminProductStore } from '../fixtures/admin-product'
import { findStockItem } from '../fixtures/admin-stock'
import { draws, saveDrawDb } from '../fixtures/draw'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { isUuid, readPaging, toPage, uuidViolation } from '../validate'

import { drawNotFound, toDraw } from './draw'

import type {
  ApiViolation,
  CreateDrawRequest,
  DrawPage,
  DrawProgress,
} from '../../types'
import type { DrawRecord } from '../fixtures/draw'
import type { RequestHandler } from 'msw'

// 관리자 럭키 드로우. 회차는 회원용 목업과 같은 저장소(draws)를 써서 여기서 만든 회차가
// 회원 목록에도 바로 보인다. 진행(progress)은 회차 id와 시각으로 흉내 낸 다른 회원 숫자에 목업 회원의
// 실제 응모를 더한다. 결과 반영 시각은 회원 응모 결과·당첨 주문과 같다(drawSettlement).

const MAX_FEE = 999_999_999_999

// 같은 Idempotency-Key면 처음 만든 회차를 돌려준다(본문은 비교하지 않는다 — 명세).
const createdByKey = new Map<string, string>()

/** 회차마다 다르지만 늘 같은 수 — 새로고침해도 진행이 튀지 않는다 */
const seedOf = (drawId: string) =>
  [...drawId].reduce((sum, char) => sum + char.charCodeAt(0), 0)

function progressOf(draw: DrawRecord): DrawProgress {
  const now = Date.now()
  const opensAt = Date.parse(draw.opensAt)
  const closesAt = Date.parse(draw.closesAt)
  const idle: DrawProgress = {
    paidEntries: 0,
    authorizingEntries: 0,
    awaitingEntries: 0,
    winners: 0,
    drawRequestedAt: null,
    settledAt: null,
  }
  if (now < opensAt) return idle

  const seed = seedOf(draw.drawId)
  const mine = memberEntryCounts(draw.drawId)
  // 응모 기간이 지난 만큼 늘어난다. 회차마다 당첨 인원의 0.5~2.5배까지 모인다.
  const elapsed = Math.min(1, (now - opensAt) / (closesAt - opensAt))
  const othersPaid = Math.round(
    draw.winnerCount * (0.5 + (seed % 5) * 0.5) * elapsed,
  )
  const paidEntries = othersPaid + mine.paid
  const awaitingEntries = Math.round(othersPaid * 0.08) + mine.awaiting

  if (now < closesAt) {
    return {
      ...idle,
      paidEntries,
      awaitingEntries,
      authorizingEntries: (seed % 7) + mine.authorizing,
    }
  }
  // 마감 직후엔 결제 확인 중인 응모가 남아 있다가 풀린다.
  const authorizingEntries =
    (now < closesAt + DRAW_REQUEST_DELAY_MS ? Math.max(1, seed % 4) : 0) +
    mine.authorizing
  const settled = now >= closesAt + DRAW_SETTLE_DELAY_MS
  return {
    paidEntries,
    authorizingEntries,
    awaitingEntries,
    // 목업 회원의 결제한 응모는 모두 당첨이다(drawSettlement).
    winners: settled
      ? Math.max(mine.won, Math.min(paidEntries, draw.winnerCount))
      : 0,
    // 결제 완료가 당첨 인원 이하면 추첨 없이 모두 당첨이라 요청 시각이 없다.
    drawRequestedAt:
      settled && paidEntries > draw.winnerCount
        ? new Date(closesAt + DRAW_REQUEST_DELAY_MS).toISOString()
        : null,
    settledAt: settled
      ? new Date(closesAt + DRAW_SETTLE_DELAY_MS).toISOString()
      : null,
  }
}

const isIntegerIn = (value: unknown, min: number, max: number) =>
  Number.isInteger(value) &&
  (value as number) >= min &&
  (value as number) <= max

function bodyViolations(body: Partial<CreateDrawRequest>): ApiViolation[] {
  const violations: ApiViolation[] = []
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (title === '' || title.length > 100)
    violations.push({ field: 'title', message: '1~100자로 입력해 주세요.' })
  if (!isIntegerIn(body.entryFee, 100, MAX_FEE))
    violations.push({
      field: 'entryFee',
      message: '100원 이상 12자리 이하 정수여야 합니다.',
    })
  if (!isIntegerIn(body.winnerCount, 1, Number.MAX_SAFE_INTEGER))
    violations.push({
      field: 'winnerCount',
      message: '1 이상 정수여야 합니다.',
    })
  const opensAt = Date.parse(String(body.opensAt))
  const closesAt = Date.parse(String(body.closesAt))
  if (Number.isNaN(opensAt))
    violations.push({ field: 'opensAt', message: '시각 형식이 아닙니다.' })
  if (Number.isNaN(closesAt))
    violations.push({ field: 'closesAt', message: '시각 형식이 아닙니다.' })
  else if (!Number.isNaN(opensAt) && closesAt <= opensAt)
    violations.push({
      field: 'closesAt',
      message: '마감은 시작보다 뒤여야 합니다.',
    })
  for (const field of ['productId', 'optionId'] as const) {
    if (typeof body[field] !== 'string' || body[field] === '')
      violations.push({ field, message: '필수 항목입니다.' })
  }
  return violations
}

const findDraw = (drawId: unknown) => draws.find((it) => it.drawId === drawId)

export const adminDrawHandlers: RequestHandler[] = [
  http.get(url('/api/v1/admin/draws'), ({ request }) => {
    const { page, size, violations } = readPaging(
      new URL(request.url).searchParams,
    )
    if (violations.length > 0) return invalid(violations)
    const sorted = [...draws].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
    const { items, total } = toPage(sorted, page, size)
    return ok<DrawPage>({ items: items.map(toDraw), page, size, total })
  }),

  http.post(url('/api/v1/admin/draws'), async ({ request }) => {
    const key = request.headers.get('Idempotency-Key')?.trim()
    if (!key)
      return fail(400, {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key 헤더가 필요합니다.',
      })
    const body = ((await request.json().catch(() => null)) ??
      {}) as Partial<CreateDrawRequest>
    const violations = bodyViolations(body)
    if (violations.length > 0) return invalid(violations)

    // 다시 보낸 요청은 지금보다 늦은 마감·증정품·재고를 다시 보지 않는다(명세).
    const replayed = findDraw(createdByKey.get(key))
    if (replayed) return ok(toDraw(replayed))

    if (Date.parse(String(body.closesAt)) <= Date.now())
      return invalid([
        { field: 'closesAt', message: '마감은 지금보다 뒤여야 합니다.' },
      ])

    // 목업 상품 id는 UUID가 아니라 형식 대신 있는지만 본다.
    const product = adminProductStore.find(
      (it) => it.productId === body.productId,
    )
    const variant = product?.variants.find(
      (it) => it.optionCode === body.optionId,
    )
    if (!product || !variant || product.saleMode !== 'IN_STOCK')
      return fail(404, {
        code: 'PRODUCT_NOT_FOUND',
        message: '증정품 옵션을 찾을 수 없습니다.',
      })
    const winnerCount = body.winnerCount as number
    const stock = findStockItem(product.productId, variant.optionCode)
    if (!stock || stock.availableQuantity < winnerCount)
      return fail(409, {
        code: 'INSUFFICIENT_STOCK',
        message: '증정품 재고가 당첨 인원보다 적습니다.',
      })
    // 당첨 인원만큼 재고를 확보한다.
    stock.availableQuantity -= winnerCount
    stock.reservedQuantity += winnerCount

    const created: DrawRecord = {
      drawId: crypto.randomUUID(),
      title: (body.title as string).trim(),
      gift: {
        productId: product.productId,
        variantId: variant.optionCode,
        productTitle: product.name,
        optionTitle: variant.name,
        imageUrl: product.thumbnailUrl,
      },
      entryFee: body.entryFee as number,
      winnerCount,
      opensAt: new Date(body.opensAt as string).toISOString(),
      closesAt: new Date(body.closesAt as string).toISOString(),
      createdAt: new Date().toISOString(),
    }
    draws.push(created)
    saveDrawDb()
    createdByKey.set(key, created.drawId)
    return ok(toDraw(created), 201)
  }),

  http.get(url('/api/v1/admin/draws/:drawId'), ({ params }) => {
    if (!isUuid(String(params.drawId)))
      return invalid([uuidViolation('drawId')])
    const draw = findDraw(params.drawId)
    return draw ? ok(toDraw(draw)) : drawNotFound()
  }),

  http.get(url('/api/v1/admin/draws/:drawId/progress'), ({ params }) => {
    if (!isUuid(String(params.drawId)))
      return invalid([uuidViolation('drawId')])
    const draw = findDraw(params.drawId)
    if (!draw) return drawNotFound()
    settleDueDraws()
    return ok(progressOf(draw))
  }),
]
