// 관리자 배송 차수 화면만 쓰는 타입이라 product.ts가 아니라 여기 둔다.
export type DispatchWave = {
  wave: number
  fromSeq: number
  toSeq: number
  /** 예상 배송일. null이면 미정 */
  estimatedDeliveryDate: string | null
}

/*
 * ponytail: 배송 차수를 버전(초안 → 게시)으로 쌓지 않고 통째로 덮어쓰기로 했다.
 * 백엔드 계약은 아직 없어서 화면에 필요한 최소 모양으로 임시 정의했다 —
 * 명세가 나오면 이 블록과 mock/handlers/admin-dispatch.ts를 함께 고친다.
 */

/**
 * 상품 하나의 배송 차수 구성. 아직 정하지 않았으면 waves가 비어 있고
 * undeterminedFromSeq가 1이다(1번부터 배송일 미정).
 */
export type DispatchWindow = {
  productId: string
  waves: DispatchWave[]
  /** 어느 차수에도 배정되지 않은 첫 순번 — 마지막 차수의 toSeq + 1 */
  undeterminedFromSeq: number
  updatedAt: string | null
  updatedBy: string | null
}

/** 차수 구성을 통째로 교체한다. 오픈 이후면 409 PRODUCT_ALREADY_OPEN */
export type DispatchWindowPutRequest = Pick<
  DispatchWindow,
  'waves' | 'undeterminedFromSeq'
>
