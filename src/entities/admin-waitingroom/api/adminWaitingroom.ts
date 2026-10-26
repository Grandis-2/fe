import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  AdmissionRateView,
  GlobalCreditRequest,
  ProductCapRequest,
  SecondsRequest,
  SettingChangesView,
  WaitingroomStatusView,
} from '@shared/api/types'

const BASE = '/api/v1/admin/waitingroom'

// [waitingroom] GET /api/v1/admin/waitingroom/status — 대기열 현황 조회
/** 대기열 현황 — 응답한 서버 기준. 1초 이상 간격으로 폴링한다 */
export const getWaitingroomStatus = (signal?: AbortSignal) =>
  apiClient.request<WaitingroomStatusView>(`${BASE}/status`, { signal })

// [waitingroom] GET /api/v1/admin/waitingroom/admission-rate — 운영값 조회
/** 지금 적용 중인 운영값과 출처 */
export const getAdmissionRates = (signal?: AbortSignal) =>
  apiClient.request<AdmissionRateView>(`${BASE}/admission-rate`, { signal })

// [waitingroom] GET /api/v1/admin/waitingroom/changes — 운영값 변경 이력
/** 누가 언제 무엇을 바꿨는지 최신순. 다음 쪽은 nextCursor로 */
export const getSettingChanges = (cursor?: string, signal?: AbortSignal) =>
  apiClient.request<SettingChangesView>(
    `${BASE}/changes${toQueryString({ cursor, size: 20 })}`,
    { signal },
  )

// 바꾸는 API는 모두 바뀐 뒤의 전체 운영값을 돌려주고, 같은 요청을 여러 번 보내도 결과가
// 같다(503이면 다시 보내거나 조회로 확인).
const put = <TBody>(path: string, body: TBody) =>
  apiClient.request<AdmissionRateView>(`${BASE}${path}`, {
    method: 'PUT',
    body,
  })
const remove = (path: string) =>
  apiClient.request<AdmissionRateView>(`${BASE}${path}`, { method: 'DELETE' })

// [waitingroom] PUT /api/v1/admin/waitingroom/admission-rate — 전역 입장 속도 변경
/** 전 상품을 합친 초당 입장 인원. 0이면 입장을 멈춘다. 권장 상한을 넘기려면 confirm */
export const setGlobalCredit = (globalCredit: number, confirm = false) =>
  put<GlobalCreditRequest>('/admission-rate', {
    globalCredit,
    ...(confirm && { confirm }),
  })
// [waitingroom] DELETE /api/v1/admin/waitingroom/admission-rate — 전역 입장 속도 초기화
export const resetGlobalCredit = () => remove('/admission-rate')

// [waitingroom] PUT /api/v1/admin/waitingroom/products/{productId}/admission-rate — 상품별 입장 상한 변경
/** 상품 하나의 초당 입장 상한. 낮춰도 이미 줄에 선 사람은 빠지지 않는다 */
export const setProductCap = (productId: string, cap: number) =>
  put<ProductCapRequest>(`/products/${productId}/admission-rate`, { cap })
// [waitingroom] DELETE /api/v1/admin/waitingroom/products/{productId}/admission-rate — 상품별 입장 상한 초기화
export const resetProductCap = (productId: string) =>
  remove(`/products/${productId}/admission-rate`)

// [waitingroom] PUT /api/v1/admin/waitingroom/max-wait — 최대 대기 시간 변경
/** 최대 대기 시간. 줄 길이가 '초당 입장 × 이 값'을 넘으면 새 진입은 429 QUEUE_FULL */
export const setMaxWait = (seconds: number) =>
  put<SecondsRequest>('/max-wait', { seconds })
// [waitingroom] DELETE /api/v1/admin/waitingroom/max-wait — 최대 대기 시간 해제
export const clearMaxWait = () => remove('/max-wait')

// [waitingroom] PUT /api/v1/admin/waitingroom/leave-grace — 이탈 유예 시간 변경
/** 조회가 끊긴 대기자를 남겨 두는 시간. 늘린 만큼 떠난 사람도 줄에 남는다 */
export const setLeaveGrace = (seconds: number) =>
  put<SecondsRequest>('/leave-grace', { seconds })
// [waitingroom] DELETE /api/v1/admin/waitingroom/leave-grace — 이탈 유예 시간 초기화
export const resetLeaveGrace = () => remove('/leave-grace')
