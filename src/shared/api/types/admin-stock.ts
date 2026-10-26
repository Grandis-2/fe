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

/** 마지막 장부 대조에서 주문 기준과 어긋난 옵션 하나(대조한 때의 값) */
export type StockReconcileDriftOption = {
  optionId: string
  /** 보정 경로에 쓴다. 상품 쪽에 옵션 정보가 없으면 null이고 보정할 수 없다 */
  productId: string | null
  registered: boolean
  stockTotal: number
  expectedReserved: number
  stockReserved: number
  expectedSold: number
  stockSold: number
  /** 대조가 끝난 뒤 마지막으로 보정한 시각. 보정하지 않았으면 null */
  correctedAt: string | null
}

/**
 * 마지막으로 끝난 재고 장부 대조(GET /admin/stock/reconcile-runs/latest). 매일 새벽
 * 4시(KST)에 돈다. 한 번도 끝나지 않았으면 404 STOCK_RECONCILE_RUN_NOT_FOUND다.
 */
export type StockReconcileRunResponse = {
  startedAt: string
  finishedAt: string
  /** 어긋난 옵션 전체 수 */
  driftOptions: number
  /** options가 앞 1000개로 잘렸는지 */
  truncated: boolean
  options: StockReconcileDriftOption[]
}

/** 주문 기준으로 보정(POST .../stock/options/{optionId}/reconcile) — 사유는 기록에 남는다 */
export type StockCorrectionRequest = {
  /** 필수, 공백 불가, 500자 이하 */
  reason: string
}

/** GET .../stock/options/{optionId}/reconcile — 보정 미리보기(아무것도 바꾸지 않는다) */
export type StockCorrectionPreview = {
  optionId: string
  /** 재고를 넣지 않은 옵션이면 false이고 장부 값은 0 */
  registered: boolean
  /** 총량. 보정으로 바뀌지 않는다 */
  stockTotal: number
  stockReserved: number
  stockSold: number
  /** 보정하면 stockReserved·stockSold가 이 값이 된다 */
  expectedReserved: number
  expectedSold: number
  /** 장부가 주문 기준과 같다(보정할 것 없음) */
  matches: boolean
}

export type StockCorrectionResponse = {
  optionId: string
  registered: boolean
  stockTotal: number
  before: { stockReserved: number; stockSold: number }
  after: { stockReserved: number; stockSold: number }
  /** 이미 주문 기준과 같았으면 false */
  changed: boolean
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
