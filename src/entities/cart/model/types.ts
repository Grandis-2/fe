export type CartItem = {
  id: string
  imageSrc?: string
  name: string
  /** 모델명(예: A3714). 옵션이 아니라 제품 식별자다. */
  modelNumber: string
  /** 색상·용량·부가상품 요약 */
  optionSummary: string
  quantity: number
  /** 원 단위 단가. 합계를 내야 해서 포맷된 문자열이 아니라 숫자로 둔다. */
  price: number
}
