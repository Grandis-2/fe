// 재고 API(order 서비스 — GET·PUT /api/v1/admin/products/{productId}/stock).
// 옵션은 optionId로 가리키는데, 상품 상세의 variantId와 같은 값이다.

/** 재고 조회 한 줄 */
export type StockOverviewItem = {
  /** 옵션 id — 상품 상세의 variantId와 같다 */
  optionId: string
  /** 재고를 넣었는지. false면 수량이 모두 0이고 구매 화면에서 품절로 보인다 */
  registered: boolean
  /** 총량(관리자 배정) */
  stockTotal: number
  /** 확보 — 진행 중인 주문이 잡아 둔 수량 */
  stockReserved: number
  /** 판매 수량 */
  stockSold: number
  /** 가용 = 총량 - 확보 - 판매 */
  available: number
}

/**
 * 재고 조회 응답. 사전예약 상품은 재고를 세지 않아 tracked가 false이고 items가 비어
 * 있다 — 명세는 이때 재고 탭을 숨기라고 한다.
 */
export type StockOverviewResponse = {
  productId: string
  tracked: boolean
  items: StockOverviewItem[]
}

/**
 * 재고 총량 설정(PUT). 요청한 옵션만 덮어쓰고 나머지는 그대로다. 전부 반영되거나
 * 전부 안 된다 — 한 옵션이라도 총량이 확보+판매보다 작으면 409다.
 */
export type StockRequest = {
  items: { optionId: string; stockTotal: number }[]
}

// ── 아래는 예전 모양(프론트 제안). 목업 저장소가 아직 쓴다 — 등록을 명세에 맞출 때
// 같이 걷어낸다.

// 스펙에 LIMITED만 등장한다. 다른 값이 생기면 여기에 추가한다.
export type StockPolicyLimited = 'LIMITED'

export type AdminStockItem = {
  productId: string
  optionCode: string
  policy: StockPolicyLimited
  /** 운영자가 설정한 총 수량 */
  initialQuantity: number
  /** 아직 남은 수량 */
  availableQuantity: number
  /** 예약으로 잡혀 있는 수량 */
  reservedQuantity: number
  adjustmentsEnabled: boolean
  updatedAt: string
  updatedBy: string | null
}
