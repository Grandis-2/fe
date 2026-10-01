// 상품 상세의 handleCheckout이 navigate(path, { state })로 결제 화면에 넘기는 주문 초안 —
// 두 화면이 같은 모양을 써야 하므로 한 곳에 선언한다. 직접 /payment로 들어오면(딥링크 등)
// 없을 수 있다.
export type PurchaseDraft = {
  productName: string
  colorLabel: string
  optionLabel: string
  quantity: number
  unitPrice: number
}
