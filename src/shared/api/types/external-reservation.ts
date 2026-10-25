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

export type MockFailureMode = 'HTTP_5XX' | 'TIMEOUT' | 'MIXED'

export type MockMixedResponse =
  'HTTP_500' | 'HTTP_500_NO_BODY' | 'HTTP_502' | 'HTTP_503' | 'HTTP_504'

/** GET·PUT /external/config 응답 — 지금 적용 중인 지연·실패 설정 */
export type MockConfig = {
  /** 등록 지연 평균(ms) */
  registerLatencyMs: number
  /** 지연을 흔드는 폭(읽기 전용). 평균 × (1 ∓ 이 값) */
  latencyJitter: number
  /** 느린 꼬리에 걸릴 확률. 0이면 꼬리 없음 */
  latencyTailRate: number
  latencyTailMinMs: number
  latencyTailMaxMs: number
  /** 꼬리에 안 걸린 요청의 평균(읽기 전용) */
  bodyLatencyMs: number
  /** 등록이 일시 실패할 확률(0~1) */
  failureRate: number
  failureMode: MockFailureMode
  /** MIXED에서 섞는 종류. MIXED가 아니면 빈 배열 */
  mixedResponses: MockMixedResponse[]
  /** 바꿀 때마다 1 오르고 재기동하면 0부터 */
  configVersion: number
  appliedAt: string
  /** TIMEOUT·응답 유실이 응답 없이 붙잡는 시간(읽기 전용) */
  timeoutHoldMs: number
  /** 본 서비스 워커의 읽기 타임아웃(읽기 전용, 기록용) */
  workerReadTimeoutMs: number
}

/**
 * PUT /external/config — 통째 교체. 꼬리 세 칸은 함께 보내거나 함께 빼고,
 * mixedResponses는 MIXED일 때만 보낸다. 응답 전용 칸을 보내면 400이다.
 */
export type MockConfigUpdate = Pick<
  MockConfig,
  'registerLatencyMs' | 'failureRate'
> &
  Partial<
    Pick<
      MockConfig,
      | 'failureMode'
      | 'latencyTailRate'
      | 'latencyTailMinMs'
      | 'latencyTailMaxMs'
      | 'mixedResponses'
    >
  >

/** POST /external/reset — 전체 초기화라 확인 문자열을 받는다 */
export type MockResetRequest = { confirm: 'RESET' }
// 등록 원장은 deletedCount, 럭키드로우는 회차·응모 수를 따로 준다.
export type MockResetResponse = {
  deletedCount: number
  deletedDraws: number
  deletedDrawEntries: number
}

export type MockFaultType = 'RESPONSE_LOST_AFTER_COMMIT' | 'SLOW_SUCCESS'

/** POST /external/faults — 지정한 키의 다음 등록에 결함을 한 번 건다 */
export type MockFaultRequest = {
  externalKey: string
  faultType: MockFaultType
  /** SLOW_SUCCESS에만 필수(1~60000ms) */
  delayMs?: number
}

export type MockFaultResponse = Required<
  Pick<MockFaultRequest, 'externalKey' | 'faultType'>
> & {
  delayMs: number | null
  createdAt: string
}
