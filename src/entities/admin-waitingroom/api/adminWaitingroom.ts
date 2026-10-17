import { apiClient } from '@shared/api/client'
import type {
  AdmissionRateView,
  GlobalCreditRequest,
  ProductCapRequest,
  SecondsRequest,
  WaitingroomStatusView,
} from '@shared/api/types'

const BASE = '/api/v1/admin/waitingroom'

/** 대기열 현황 — 응답한 서버 기준. 1초 이상 간격으로 폴링한다 */
export const getWaitingroomStatus = (signal?: AbortSignal) =>
  apiClient.request<WaitingroomStatusView>(`${BASE}/status`, { signal })

/** 지금 적용 중인 운영값과 출처 */
export const getAdmissionRates = (signal?: AbortSignal) =>
  apiClient.request<AdmissionRateView>(`${BASE}/admission-rate`, { signal })

// 바꾸는 API는 모두 바뀐 뒤의 전체 운영값을 돌려주고, 같은 요청을 여러 번 보내도 결과가
// 같다(503이면 다시 보내거나 조회로 확인).
const put = <TBody>(path: string, body: TBody) =>
  apiClient.request<AdmissionRateView>(`${BASE}${path}`, {
    method: 'PUT',
    body,
  })
const remove = (path: string) =>
  apiClient.request<AdmissionRateView>(`${BASE}${path}`, { method: 'DELETE' })

/** 전 상품을 합친 초당 입장 인원. 0이면 입장을 멈춘다 */
export const setGlobalCredit = (globalCredit: number) =>
  put<GlobalCreditRequest>('/admission-rate', { globalCredit })
export const resetGlobalCredit = () => remove('/admission-rate')

/** 상품 하나의 초당 입장 상한. 낮춰도 이미 줄에 선 사람은 빠지지 않는다 */
export const setProductCap = (productId: string, cap: number) =>
  put<ProductCapRequest>(`/products/${productId}/admission-rate`, { cap })
export const resetProductCap = (productId: string) =>
  remove(`/products/${productId}/admission-rate`)

/** 최대 대기 시간. 줄 길이가 '초당 입장 × 이 값'을 넘으면 새 진입은 429 QUEUE_FULL */
export const setMaxWait = (seconds: number) =>
  put<SecondsRequest>('/max-wait', { seconds })
export const clearMaxWait = () => remove('/max-wait')

/** 조회가 끊긴 대기자를 남겨 두는 시간. 늘린 만큼 떠난 사람도 줄에 남는다 */
export const setLeaveGrace = (seconds: number) =>
  put<SecondsRequest>('/leave-grace', { seconds })
export const resetLeaveGrace = () => remove('/leave-grace')
