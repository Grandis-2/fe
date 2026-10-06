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
 * 폴링 간격. 마지막 조회가 끝내 실패했으면 간격을 늘려, 이미 힘든 서버를 원래 주기로
 * 계속 두드리지 않는다. 다음 조회가 성공하면 바로 원래 간격으로 돌아온다.
 *
 * 실패 횟수에 따라 두 배씩 늘리는 방식은 쓰지 않는다 — TanStack Query는 새 fetch를
 * 시작할 때 fetchFailureCount를 0으로 되돌려서(query-core의 fetchState), 그 값으로는
 * '연속 몇 주기째 실패인지'를 셀 수 없다. 한 주기 안의 재시도 횟수만 들어 있다.
 */
export const pollingInterval =
  (baseMs: number, failedMs = baseMs * 4) =>
  // Query 제네릭과 엮이지 않게 필요한 필드만 받는다.
  (query: { state: { status: 'pending' | 'error' | 'success' } }) =>
    query.state.status === 'error' ? failedMs : baseMs

// QueryClient 기본값 — 정책을 고르지 않은 쿼리도 4xx를 헛되이 재시도하지 않게 한다.
// 변경(mutation)은 같은 요청이 두 번 반영될 수 있어 자동 재시도하지 않는다.
export const defaultQueryOptions = {
  queries: { retry: retryUpTo(1) },
  mutations: { retry: false },
} as const

/**
 * 변경(mutation)을 화면에 반영하는 방식. 고르는 기준은 하나다 —
 * **틀렸을 때 되돌리면 그만인가.**
 *
 * - 서버 확인(기본): `onSuccess`에서 응답으로 캐시를 갱신한다. 돈·순번·재고처럼
 *   서버가 정하는 값이 걸리면 이쪽이다. 예약 접수가 돌려주는 순번을 미리 지어내
 *   보여주면, 서버가 다른 번호를 주더라도 사용자가 이미 본 숫자라 되돌릴 수 없다.
 * - 낙관적: `onMutate`에서 캐시를 먼저 바꾸고 실패하면 되돌린다. 장바구니 수량이나
 *   토글처럼 틀려도 원래대로 돌리면 끝나는 값에만 쓴다.
 *
 * 지금은 전부 서버 확인이다(프로필·기본 배송지·상품·배송 차수). 첫 낙관적
 * 업데이트가 생기면 되돌리기까지 같이 넣고, 반복되면 그때 여기에 헬퍼를 만든다.
 */
