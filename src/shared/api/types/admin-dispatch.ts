export type DispatchWave = {
  wave: number
  fromSeq: number
  toSeq: number
  /** 예상 배송일. null이면 미정 */
  estimatedDeliveryDate: string | null
}

export type DispatchWindowVersion = {
  waves: DispatchWave[]
  undeterminedFromSeq: number | null
  productId: string
  version: number
  // publishedAt이 별도로 있는 걸로 보아 발행 상태가 존재한다. 확인되면 정정할 것.
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
  createdBy: string
  publishedAt: string | null
  confirmedCountByWave: Record<string, number> | null
}

export type DispatchWindowListResponse = {
  items: DispatchWindowVersion[]
}

/** 새 배송 차수 구간 버전을 초안으로 만든다 */
export type DispatchWindowCreateRequest = {
  /** 최소 1개 */
  waves: DispatchWave[]
  /** 배송일이 아직 정해지지 않은 첫 순번. 마지막 차수의 toSeq보다 커야 한다 */
  undeterminedFromSeq: number
}

export type ProductOpenAtRequest = {
  openAt: string
}
