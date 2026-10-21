import { drawEntries, draws, saveDrawDb } from './fixtures/draw'
import { orders, saveOrderDb } from './fixtures/preorder'

import type { DrawEntryRecord, DrawRecord } from './fixtures/draw'
import type { OrderRecord } from './fixtures/preorder'

// 럭키 드로우 추첨 흉내. 서버는 마감 30초 뒤부터 추첨하고, 목업은 그 10초 뒤 결과를 반영한다.
// 회원 응모 결과·당첨 주문과 관리자 진행 조회가 같은 시각을 봐야 서로 어긋나지 않는다.
export const DRAW_REQUEST_DELAY_MS = 30_000
export const DRAW_SETTLE_DELAY_MS = 40_000

export const drawSettledAt = (draw: Pick<DrawRecord, 'closesAt'>) =>
  Date.parse(draw.closesAt) + DRAW_SETTLE_DELAY_MS

function winnerOrderOf(draw: DrawRecord, entry: DrawEntryRecord): OrderRecord {
  const createdAt = new Date(drawSettledAt(draw)).toISOString()
  return {
    orderId: crypto.randomUUID(),
    preorderId: null,
    cartItems: null,
    status: 'AWAITING_CONFIRMATION',
    source: 'DRAW',
    totalAmount: 0,
    paymentDueAt: null,
    items: [
      {
        orderItemId: crypto.randomUUID(),
        productId: draw.gift.productId,
        optionId: draw.gift.variantId,
        productTitle: draw.gift.productTitle,
        optionTitle: draw.gift.optionTitle,
        unitPrice: 0,
        quantity: 1,
        warrantyQuantity: 0,
        warrantyUnitPrice: 0,
        lineAmount: 0,
      },
    ],
    shipTo: entry.shipTo,
    createdAt,
    events: [
      {
        eventSequence: 1,
        fromStatus: null,
        toStatus: 'AWAITING_CONFIRMATION',
        actor: 'SYSTEM',
        reason: 'DRAW_WON',
        createdAt,
      },
    ],
  }
}

/**
 * 결과 반영 시각이 지난 회차의 결제 완료 응모에 결과를 붙이고, 당첨이면 0원 주문(source DRAW)을
 * 만든다. 서버는 스스로 하지만 목업은 응모·주문·진행을 읽을 때 따라잡는다.
 * ponytail: 목업 회원은 한 명뿐이라 결제한 응모는 모두 당첨으로 본다 — 낙첨 화면은 시드 응모로 본다.
 */
export function settleDueDraws(now = Date.now()) {
  let changed = false
  for (const entry of drawEntries) {
    if (entry.status !== 'PAID' || entry.result !== null) continue
    const draw = draws.find((it) => it.drawId === entry.drawId)
    if (!draw || now < drawSettledAt(draw)) continue
    entry.result = 'WON'
    orders.push(winnerOrderOf(draw, entry))
    changed = true
  }
  if (changed) {
    saveDrawDb()
    saveOrderDb()
  }
}

/** 회원 목업이 실제로 남긴 응모 수 — 관리자 진행 조회의 흉내 숫자에 더한다 */
export const memberEntryCounts = (drawId: string) => {
  const mine = drawEntries.filter((entry) => entry.drawId === drawId)
  const count = (status: DrawEntryRecord['status']) =>
    mine.filter((entry) => entry.status === status).length
  return {
    paid: count('PAID'),
    authorizing: count('AUTHORIZING'),
    awaiting: count('AWAITING_PAYMENT'),
    won: mine.filter((entry) => entry.result === 'WON').length,
  }
}
