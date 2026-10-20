export type PreorderBenefit = {
  title: string
  description: string
}

export type PreorderModel = {
  id: string
  name: string
  imageSrc?: string
  /** 최저가(원) — "N원부터"로 보인다. 판매 중인 옵션이 없으면 null */
  price: number | null
  /** 예약·구매하면 이동할 상품 상세 */
  productId: string
  /** 이 모델의 예약 시작 'YYYY-MM-DD'·'HH:mm'(로컬). 모르면(일반 상품·서비스 장애) 비어 온다 */
  opensAt?: string
  openTime?: string
}

// 날짜는 모두 'YYYY-MM-DD'(로컬 날짜). 상태(진행 중·오픈 예정·마감)는 날짜로 계산한다.
// 사전예약 홍보 하나(catalog /api/v1/promotions)가 사전예약 하나다 — toPreorder 참고.
export type Preorder = {
  id: string
  /** 상품 사진이 없으면 빈 문자열 — 화면은 사진 없이 그린다. */
  imageSrc: string
  imageAlt?: string
  title: string
  /** 카드에 한 줄로 보이는 대표 혜택. 혜택 API가 없어 지금은 비어 온다. */
  benefit?: string
  opensAt: string
  /** 'HH:mm' — 오픈일의 오픈 시각(카운트다운 기준) */
  openTime: string
  /** 이 날까지 예약할 수 있다. */
  closesAt: string
  /** 결제·물량 배정이 끝나는 날(마감 다음 날부터 시작). 명세에 없어 비어 오면 일정에서 뺀다. */
  paymentEndsAt?: string
  /** 1차 배송 시작 예정일(배송 차수 API). 차수가 없으면 비어 온다. */
  releaseAt?: string
  /** 홍보 상세 사진 — 위에서부터 세로로 이어 붙인다 */
  detailImageSrcs: string[]
  benefits: PreorderBenefit[]
  /** 홍보에 묶인 상품(묶은 순서) */
  models: PreorderModel[]
}
