import type { CursorPage } from './common'

// 사전예약 API(preorder 서비스 — api-docs의 preorder.json) 회원용 모양. 관리자 API는 다루지 않는다.
// 판단(취소·결제 가능 여부)은 status로, 화면 문구·버튼은 displayStatus로 한다.

// 원장 상태. 정상 흐름은 PENDING_SYNC → REGISTERED → RESERVED, 취소하면 CANCELING → CANCELED.
export type PreorderStatus =
  'PENDING_SYNC' | 'REGISTERED' | 'RESERVED' | 'CANCELING' | 'CANCELED'

// 화면 단계. PENDING_SYNC는 RECEIVED·PROCESSING, REGISTERED는 PAYABLE·PAYMENT_IN_PROGRESS·PAYMENT_EXPIRED로 나뉜다.
export type PreorderDisplayStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PAYABLE'
  | 'PAYMENT_IN_PROGRESS'
  | 'PAYMENT_EXPIRED'
  | 'RESERVED'
  | 'CANCELING'
  | 'CANCELED'

// 배송 차수. 순번이 positionFrom 이상 positionTo 이하면 이 차수다. 날짜는 'YYYY-MM-DD'.
export type ShipmentBatch = {
  batchNumber: number
  positionFrom: number
  // null이면 상한 없는 마지막 차수.
  positionTo: number | null
  estimatedShipStart: string
  estimatedShipEnd: string
}

// GET /api/v1/preorders/products/{productId}/shipment-batches(로그인 없이). 차수가 없으면 404.
export type ShipmentBatchListResponse = {
  items: ShipmentBatch[]
}

// 내 예약 목록 한 줄. 상품명·옵션명·단가는 접수 시점 값이다(수량은 항상 1).
export type PreorderSummary = {
  preorderId: string
  productId: string
  productTitle: string
  optionId: string
  optionTitle: string
  unitPrice: number
  status: PreorderStatus
  displayStatus: PreorderDisplayStatus
  // 모델 안의 접수 순번(1부터). 이 값으로 배송 차수가 정해진다.
  queuePosition: number
  shipmentBatch: ShipmentBatch
  createdAt: string
  // 결제 가능해진 시각. 외부 등록 전이면 null.
  payableFrom: string | null
  // 결제 기한(payableFrom + 24시간, 연장 없음). REGISTERED일 때만 값이 있다.
  paymentDueAt: string | null
  reservedAt: string | null
  // 상태가 바뀔 때마다 오른다 — 받은 값보다 작은 응답은 늦게 온 것이니 버린다.
  version: number
}

// 예약 상세 — 접수 뒤 폴링하는 대상.
export type PreorderDetail = PreorderSummary & {
  // 외부 예약 시스템의 예약 번호. 등록 확인 전엔 null.
  externalReference: string | null
  // 취소 버튼을 보일지. 배송 시작 여부는 취소할 때 확인한다.
  cancelable: boolean
}

// GET /api/v1/preorders 쿼리. 다음 페이지에도 status·productId는 처음과 같게 보낸다.
export type PreorderListParams = {
  status?: PreorderStatus
  productId?: string
  cursor?: string
  // 1~100(기본 20).
  size?: number
}

export type PreorderPage = CursorPage<PreorderSummary>

// POST /api/v1/preorders 본문(대기열 게이트웨이를 거쳐서만 부른다). 수량은 항상 1.
export type PreorderRequest = {
  // 쿼리의 productId와 같아야 한다.
  productId: string
  // 그 모델에서 판매 중인 옵션 id(상품 상세의 variants[].variantId).
  optionId: string
}

// 202 접수 결과. 같은 Idempotency-Key 재전송이면 기존 예약이 replayed: true로 온다(CANCELED일 수도 있다).
export type PreorderAcceptedResponse = Pick<
  PreorderSummary,
  'preorderId' | 'status' | 'queuePosition' | 'shipmentBatch' | 'createdAt'
> & {
  // 예약 상세 경로(Location 헤더와 같다) — 이 경로를 폴링한다.
  statusUrl: string
  replayed: boolean
}

// POST /api/v1/preorders/{preorderId}/cancel 본문. 사유는 선택(500자 이하)이고 이력에 남는다.
export type PreorderCancelRequest = {
  reason?: string
}

// 202 — 보통 CANCELING, 이미 끝났으면 CANCELED. 완료는 비동기라 상세를 폴링한다.
export type PreorderCancelResult = Pick<
  PreorderSummary,
  'preorderId' | 'status' | 'version'
>

// GET /api/v1/preorders/{preorderId}/history 한 줄. 첫 줄(접수)은 fromStatus가 null.
export type PreorderEvent = {
  eventSequence: number
  fromStatus: PreorderStatus | null
  toStatus: PreorderStatus
  // SYSTEM이면 서버가 처리한 것.
  actor: 'USER' | 'ADMIN' | 'SYSTEM'
  reason: string | null
  createdAt: string
}

export type PreorderEventListResponse = {
  items: PreorderEvent[]
}
