export type PreorderBenefit = {
  title: string
  description: string
}

export type PreorderModel = {
  id: string
  name: string
  imageSrc?: string
  /** 최저가(원) — "N원부터"로 보인다. */
  price: number
  /** 예약·구매하면 이동할 상품 상세 */
  productId: string
}

// 날짜는 모두 'YYYY-MM-DD'(로컬 날짜). 상태(진행 중·오픈 예정·마감)는 날짜로 계산한다.
export type Preorder = {
  id: string
  imageSrc: string
  imageAlt?: string
  title: string
  /** 카드에 한 줄로 보이는 대표 혜택 */
  benefit: string
  opensAt: string
  /** 'HH:mm' — 오픈일의 오픈 시각(카운트다운 기준) */
  openTime: string
  /** 이 날까지 예약할 수 있다. */
  closesAt: string
  /** 결제·물량 배정이 끝나는 날(마감 다음 날부터 시작) */
  paymentEndsAt: string
  releaseAt: string
  benefits: PreorderBenefit[]
  models: PreorderModel[]
}
