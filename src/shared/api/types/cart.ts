// 장바구니 API(order 서비스 — api-docs의 order.json "장바구니"). 회원(USER) 토큰만 받는다.
// 가격은 저장해 두지 않고 조회할 때마다 지금 값으로 계산해 온다(담을 때와 달라질 수 있다).

// 지금 살 수 없는 이유. 여럿이 겹치면 위의 것 하나만 온다.
export type CartUnavailableReason =
  // 옵션이 없어짐 — 상품·금액 칸이 null. 판매 종료, 삭제 유도.
  | 'DISCONTINUED'
  // 비공개·판매 준비 전, 또는 사전예약으로 바뀐 상품.
  | 'HIDDEN'
  // 상품이나 옵션이 판매 중지.
  | 'PAUSED'
  // 보증을 골랐는데 더는 보증을 팔지 않음 — 보증 없이 다시 담기 안내.
  | 'WARRANTY_UNAVAILABLE'
  // 가용 재고 0.
  | 'OUT_OF_STOCK'
  // 담은 수량이 가용 재고보다 많음 — availableQuantity 이하로 수량 변경 안내.
  | 'INSUFFICIENT_STOCK'

// GET /api/v1/cart 한 줄. 같은 옵션이라도 보증 포함 줄과 미포함 줄은 따로 온다.
export type CartLine = {
  cartItemId: string
  // 판매 종료(DISCONTINUED)면 상품·옵션 이름, 이미지, 금액 칸이 null.
  productId: string | null
  // 주문 요청의 items[].variantId에 넣는다.
  variantId: string
  productTitle: string | null
  optionTitle: string | null
  imageUrl: string | null
  warranty: boolean
  // 1~99.
  quantity: number
  // 주문 요청의 expectedUnitPrice에 넣는다.
  unitPrice: number | null
  // 보증 1개 가격. 보증을 고르지 않았거나 더는 팔지 않으면 0. 보증 줄은 expectedWarrantyPrice에 넣는다.
  warrantyPrice: number | null
  // (unitPrice + warrantyPrice) × quantity.
  lineAmount: number | null
  // 지금 가용 재고(확인만 하고 잡아 두지 않는다).
  availableQuantity: number
  // false면 선택을 막고 unavailableReason을 보여 준다.
  purchasable: boolean
  unavailableReason: CartUnavailableReason | null
}

// 담은 순서(오래된 것부터). 비었으면 빈 배열.
export type Cart = {
  items: CartLine[]
}

// POST /api/v1/cart/items — 같은 옵션·같은 보증 여부의 줄이 있으면 수량을 더한다(더한 뒤 99 이하, 최대 50줄).
// 같은 요청을 다시 보내면 또 더해지므로, 응답을 못 받았으면 다시 보내지 말고 장바구니를 조회한다.
export type CartItemAddRequest = {
  variantId: string
  quantity: number
  // 생략하면 false. 보증을 팔지 않는 상품에 true면 400.
  warranty?: boolean
}

// PATCH /api/v1/cart/items/{cartItemId} — 더할 값이 아니라 최종 수량(1~99).
export type CartItemQuantityRequest = {
  quantity: number
}

// 담기·수량 변경 뒤의 줄. 금액은 장바구니를 다시 조회해 그린다.
export type CartItemResponse = Pick<
  CartLine,
  'cartItemId' | 'variantId' | 'warranty' | 'quantity'
>
