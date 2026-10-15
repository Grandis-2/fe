// 외부 예약 시스템(Mock, api-docs의 mock.json) 원장. 팀 공통 봉투({ success, data })를
// 쓰지 않고 자원을 그대로 준다. 실패는 { errorCode, errorMessage } 모양이다.

/** 원장 한 행. 등록 행과 취소 표식 행이 섞여 온다 */
export type ExternalLedgerRow = {
  /** 등록 때 보낸 Idempotency-Key — 우리 예약 id(preorderId)다 */
  externalKey: string
  /** 외부 예약번호(R-yyyyMMdd-NNNNNNNNNN). 취소 표식 행이면 null */
  externalNumber: string | null
  customerId: string | null
  productId: string | null
  sku: string | null
  /** ACTIVE: 등록돼 있음, CANCELED: 취소됨(또는 취소 표식만 있음) */
  status: 'ACTIVE' | 'CANCELED'
  confirmedAt: string | null
  canceledAt: string | null
}

/** GET /external/reservations — nextCursor가 null이 될 때까지 이어 받는다 */
export type ExternalLedgerPage = {
  items: ExternalLedgerRow[]
  nextCursor: string | null
}

export type ExternalErrorResponse = {
  errorCode: string
  errorMessage: string
}
