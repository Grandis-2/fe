export type CartItem = {
  cartItemId: string
  productId: string
  optionCode: string
  // 1 이상의 정수. 상한은 mock의 MAX_QUANTITY 참고.
  quantity: number
  unitPrice: number
}

export type Cart = {
  items: CartItem[]
  // 장바구니 전체 합계다. 선택한 항목의 합계가 아니다.
  totalAmount: number
}

export type AddCartItemRequest = Pick<
  CartItem,
  'productId' | 'optionCode' | 'quantity'
>

// 보낸 필드만 변경한다. 둘 다 비어 있으면 400.
export type UpdateCartItemRequest = Partial<
  Pick<CartItem, 'optionCode' | 'quantity'>
>
