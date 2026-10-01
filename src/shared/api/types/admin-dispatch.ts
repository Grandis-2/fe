import type { DispatchWave, DispatchWindowVersion } from './product'

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
