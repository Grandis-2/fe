import type { PaymentAttempt, ShipTo, ShipToInput } from './order'

// 럭키 드로우 API(order 서비스 — api-docs의 order.json). 회차(Draw)는 회원과 관리자(/admin/draws)가 같은 모양을 쓴다.
// 회차는 증정품(gift) 하나를 걸고, 응모비를 한 번 결제한 응모만 추첨 대상이 된다. 당첨되면 서버가 0원 주문(source DRAW)을 만든다.

// SCHEDULED 시작 전, OPEN 응모 중, CLOSED 마감. 응답 시점의 서버 시각 기준이고 추첨이 끝났는지는 나타내지 않는다.
export type DrawPhase = 'SCHEDULED' | 'OPEN' | 'CLOSED'

// 증정품 — 회차를 만든 때의 값으로 고정된다. imageUrl은 없으면 null.
export type DrawGift = {
  productId: string
  variantId: string
  productTitle: string
  optionTitle: string
  imageUrl: string | null
}

export type Draw = {
  drawId: string
  title: string
  gift: DrawGift
  // 응모비(원).
  entryFee: number
  winnerCount: number
  opensAt: string
  closesAt: string
  phase: DrawPhase
  createdAt: string
}

// 오프셋 페이지 — page는 0부터, 전체 건수는 total.
export type DrawPage = {
  items: Draw[]
  page: number
  size: number
  total: number
}

export type DrawListParams = {
  page?: number
  // 1~100(기본 20).
  size?: number
}

// AWAITING_PAYMENT 응모비 결제 전(거절·결제창 만료도 여기로 돌아온다), AUTHORIZING 결제 확인 중, PAID 결제 완료로 추첨 대상.
export type DrawEntryStatus = 'AWAITING_PAYMENT' | 'AUTHORIZING' | 'PAID'

export type DrawEntry = {
  entryId: string
  drawId: string
  status: DrawEntryStatus
  // 결과 반영 전이거나 PAID가 아니면 null. WON이면 내 주문 목록에 0원 주문이 있다.
  result: 'WON' | 'LOST' | null
  shipTo: ShipTo
  createdAt: string
  draw: Draw
}

// 내 응모 목록 줄의 상태 배지(응답 시점 기준) — 결제 전 · 결제 확인 중(마감 뒤에도 올 수 있다) · 결과 발표 전 ·
// 당첨 · 낙첨 · 결제 없이 마감(추첨 대상 아님).
export type MyDrawEntryState =
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_CONFIRMING'
  | 'AWAITING_RESULT'
  | 'WON'
  | 'LOST'
  | 'CLOSED_UNPAID'

export type MyDrawEntryItem = {
  entryId: string
  state: MyDrawEntryState
  enteredAt: string
  // 당첨으로 생긴 0원 주문(내 주문 목록의 source DRAW). 당첨이 아니면 null.
  wonOrderId: string | null
  draw: Draw
}

// 탭 — ALL은 결제하지 않은 응모까지 전부, WON은 당첨만.
export type MyDrawEntryFilter = 'ALL' | 'WON'

export type MyDrawEntriesParams = DrawListParams & {
  filter?: MyDrawEntryFilter
}

// GET /api/v1/draws/entries/me — 응모 최신순. total은 고른 탭의 건수, counts는 탭과 상관없이 두 탭의 건수.
export type MyDrawEntriesResponse = Omit<DrawPage, 'items'> & {
  items: MyDrawEntryItem[]
  counts: { all: number; won: number }
}

// POST /api/v1/draws/{drawId}/entries 본문 — 배송지만 보낸다. 이미 응모했으면 새 배송지는 무시된다.
export type EnterDrawRequest = {
  shipTo: ShipToInput
}

// POST .../entries/me/payment-attempts 201 — 주문 결제 준비 응답과 모양이 같다.
export type EntryPaymentAttempt = PaymentAttempt

// POST .../entries/me/payment-attempts/{tossOrderId}/confirm 200 — APPROVED는 응모 완료, DECLINED는 결제 준비부터 다시,
// PENDING은 내 응모를 폴링한다.
export type EntryConfirmResponse = {
  result: 'APPROVED' | 'DECLINED' | 'PENDING'
  entryStatus: DrawEntryStatus
  declineReason: 'CARD_REJECTED' | 'PAYMENT_EXPIRED' | 'FAILED' | null
}

// POST /api/v1/admin/draws 본문 — 모든 칸이 필수다. Idempotency-Key 헤더가 함께 필요하다.
// 증정품은 일반 판매·판매 중·재고 등록을 마친 옵션이고, 만들 때 winnerCount만큼 재고를 확보한다(모자라면 409 INSUFFICIENT_STOCK).
export type CreateDrawRequest = {
  productId: string
  optionId: string
  // 100자 이하. 결제창 이름으로도 쓰인다.
  title: string
  // 100 이상 정수, 12자리 이하.
  entryFee: number
  // 1 이상 정수.
  winnerCount: number
  // ISO-8601. 지난 시각이면 바로 응모 중이다.
  opensAt: string
  // 시작보다 뒤이고 지금보다 뒤.
  closesAt: string
}

// GET /api/v1/admin/draws/{drawId}/progress — 응모 수와 추첨 진행. 추첨은 마감 30초 뒤부터
// authorizingEntries가 0이면 서버가 한다. 결제 완료가 당첨 인원 이하면 추첨 없이 모두 당첨이라 drawRequestedAt은 null로 남는다.
export type DrawProgress = {
  // 결제 완료 — 추첨 대상.
  paidEntries: number
  // 결제 확인 중 — 마감 뒤 0이 돼야 추첨한다.
  authorizingEntries: number
  // 결제 대기 — 응모비를 내지 않아 추첨 대상이 아니고 추첨을 막지도 않는다.
  awaitingEntries: number
  // 당첨 주문이 생긴 응모 수. 결과 반영 전엔 0.
  winners: number
  drawRequestedAt: string | null
  // 결과를 반영한 시각. 마감 뒤 1시간이 넘도록 null이면 정상이 아니다.
  settledAt: string | null
}
