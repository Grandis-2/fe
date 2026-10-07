export type CartItem = {
  id: string
  productId: string
  optionCode: string
  quantity: number
  /** 원 단위 단가. 합계를 내야 해서 포맷된 문자열이 아니라 숫자로 둔다. */
  price: number
}
