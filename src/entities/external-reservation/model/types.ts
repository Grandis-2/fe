import type {
  ExternalLedgerRow,
  MockFailureMode,
  MockFaultType,
  MockMixedResponse,
} from '@shared/api/types'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
export type ExternalReservation = ExternalLedgerRow

export const externalStatusLabel: Record<
  ExternalReservation['status'],
  string
> = {
  ACTIVE: '등록됨',
  CANCELED: '취소됨',
}

export type {
  MockConfig,
  MockConfigUpdate,
  MockFailureMode,
  MockFaultType,
  MockMixedResponse,
} from '@shared/api/types'

/** 설정 범위(서버 검증과 같다) */
export const MOCK_LATENCY_MAX_MS = 60_000
export const MOCK_FAULT_DELAY_MAX_MS = 60_000

export const mockFailureModeLabel: Record<MockFailureMode, string> = {
  HTTP_5XX: 'HTTP 5xx 오류',
  TIMEOUT: '응답 없음(타임아웃)',
  MIXED: '여러 응답 섞기',
}

export const mockMixedResponses: MockMixedResponse[] = [
  'HTTP_500',
  'HTTP_500_NO_BODY',
  'HTTP_502',
  'HTTP_503',
  'HTTP_504',
]

/** 섞을 응답의 짧은 이름 — 칩에 그대로 쓴다 */
export const mockMixedResponseLabel: Record<MockMixedResponse, string> = {
  HTTP_500: '500',
  HTTP_500_NO_BODY: '500 본문 없음',
  HTTP_502: '502',
  HTTP_503: '503',
  HTTP_504: '504',
}

export const mockFaultTypeLabel: Record<MockFaultType, string> = {
  RESPONSE_LOST_AFTER_COMMIT: '저장 뒤 응답 유실',
  SLOW_SUCCESS: '늦게 성공',
}
