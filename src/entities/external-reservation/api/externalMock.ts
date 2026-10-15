import type {
  MockConfig,
  MockConfigUpdate,
  MockFaultRequest,
  MockFaultResponse,
  MockResetRequest,
  MockResetResponse,
} from '@shared/api/types'

import { requestExternal } from './externalClient'

// 팀이 같이 쓰는 Mock 서버라 바꾸는 요청은 다른 사람의 시험에도 바로 영향이 간다.

/** 지금 적용 중인 지연·실패 설정. 재기동하면 기본값으로 돌아간다 */
export const getMockConfig = (signal?: AbortSignal) =>
  requestExternal<MockConfig>('/external/config', { signal })

/** 통째 교체 — 보내지 않은 선택 칸은 꼬리 없음·HTTP_5XX로 돌아간다. 응답은 실제 적용값 */
export const updateMockConfig = (body: MockConfigUpdate) =>
  requestExternal<MockConfig>('/external/config', { method: 'PUT', body })

/** 원장 전체와 걸린 결함을 지운다. 되돌릴 수 없고, 진행 중인 등록이 있으면 409 RESET_BUSY */
export const resetMockLedger = () =>
  requestExternal<MockResetResponse>('/external/reset', {
    method: 'POST',
    body: { confirm: 'RESET' } satisfies MockResetRequest,
  })

/** 지정한 키의 다음 등록에 결함을 한 번 건다(발동하면 저절로 풀린다) */
export const injectMockFault = (body: MockFaultRequest) =>
  requestExternal<MockFaultResponse>('/external/faults', {
    method: 'POST',
    body,
  })
