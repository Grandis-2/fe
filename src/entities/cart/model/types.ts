export type CartItem = {
  id: string
  productId: string
  imageSrc?: string
  name: string
  /** 모델명(예: A3112). 옵션이 아니라 제품 식별자다. */
  modelNumber: string
  /** 선택한 옵션 이름(예: 512GB 스페이스 블랙) */
  optionSummary: string
  quantity: number
  /** 원 단위 단가. 합계를 내야 해서 포맷된 문자열이 아니라 숫자로 둔다. */
  price: number
}
