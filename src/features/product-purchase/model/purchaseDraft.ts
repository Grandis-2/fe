// 결제 화면에 navigate(path, { state: PurchaseDraft[] })로 넘기는 주문 상품 한 줄 — 상품 상세(바로 구매,
// 한 줄짜리)와 장바구니(고른 상품들)가 같은 모양을 써야 하므로 한 곳에 선언한다. 직접 /payment로
// 들어오면(딥링크 등) 없을 수 있다.
export type PurchaseDraft = {
  // 고른 옵션 조합의 id — 주문(POST /api/v1/orders)·사전예약 접수에 보낼 값이다.
  variantId: number
  productName: string
  // "실버 · 512GB"처럼 고른 옵션을 한 줄로 이은 문구.
  optionSummary: string
  quantity: number
  unitPrice: number
}
