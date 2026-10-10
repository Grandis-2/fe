// 사전예약 API(preorder 서비스 — api-docs의 preorder.json) 회원용 모양. 관리자 API는 다루지 않는다.

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
