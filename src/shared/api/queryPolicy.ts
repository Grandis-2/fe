import { ApiRequestError } from './client'

// 다시 보내도 결과가 같은 실패(4xx — 인증·검증·없음)는 재시도하지 않는다.
// 응답을 못 받았거나(타임아웃·네트워크, status 0) 서버 오류(5xx)일 때만 다시 묻는다.
export const isRetryableError = (error: unknown) =>
  !(error instanceof ApiRequestError) ||
  error.status === 0 ||
  error.status >= 500

// 재시도가 다 실패하면 그때 isError로 화면에 반영된다.
const retryUpTo = (max: number) => (failureCount: number, error: unknown) =>
  failureCount < max && isRetryableError(error)

/**
 * 조회 데이터 유형별 캐시·재시도 정책. useQuery에 값을 직접 쓰지 말고 여기서 골라 펼친다
 * — `useQuery({ queryKey, queryFn, ...queryPolicy.catalog })`.
 * 새 유형이 필요하면 값을 하드코딩하지 말고 여기에 추가한다.
 */
export const queryPolicy = {
  // 상품 목록·검색·상세 — 몇 분 사이엔 거의 안 바뀌는 공개 데이터. 5분간 캐시를 그대로 쓴다.
  catalog: { staleTime: 5 * 60_000, retry: retryUpTo(2) },
  // 프로필·기본 배송지 — 내가 바꿀 때만 바뀌고, 저장 응답으로 캐시를 직접 갱신한다
  // (useUpdateProfile 등). 비로그인 401은 isRetryableError가 걸러 재시도하지 않는다.
  account: { staleTime: 5 * 60_000, retry: retryUpTo(1) },
  // 장바구니·알림 개수 — 다른 화면이나 서버에서 바뀌는 값. 다시 볼 때마다 새로 묻는다.
  live: { staleTime: 0, retry: retryUpTo(1) },
} as const

/**
 * 폴링 간격. 실패가 이어지면 간격을 두 배씩 늘려(최대 maxMs) 이미 힘든 서버를
 * 더 두드리지 않는다. 성공하면 fetchFailureCount가 0으로 돌아가 원래 간격이 된다.
 */
export const pollingInterval =
  (baseMs: number, maxMs = baseMs * 8) =>
  // Query 제네릭과 엮이지 않게 필요한 필드만 받는다.
  (query: { state: { fetchFailureCount: number } }) =>
    Math.min(baseMs * 2 ** query.state.fetchFailureCount, maxMs)

// QueryClient 기본값 — 정책을 고르지 않은 쿼리도 4xx를 헛되이 재시도하지 않게 한다.
// 변경(mutation)은 같은 요청이 두 번 반영될 수 있어 자동 재시도하지 않는다.
export const defaultQueryOptions = {
  queries: { retry: retryUpTo(1) },
  mutations: { retry: false },
} as const
