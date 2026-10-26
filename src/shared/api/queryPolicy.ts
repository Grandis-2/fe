import {
  replaceEqualDeep,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query'

import { ApiRequestError } from './client'
import { logWait } from './requestLog'

// 다시 보내도 결과가 같은 실패(4xx — 인증·검증·없음)는 재시도하지 않는다.
// 응답을 못 받았거나(타임아웃·네트워크, status 0) 서버 오류(5xx)일 때만 다시 묻는다.
// 401이라도 details.retryable이면 세션 문제가 아니라 일시 장애다(명세) — apiClient가 한 번
// 다시 보내고도 실패한 것이라 5xx처럼 다룬다.
export const isRetryableError = (error: unknown) =>
  !(error instanceof ApiRequestError) ||
  error.status === 0 ||
  error.status >= 500 ||
  (error.status === 401 && error.error.details?.retryable === true)

// 재시도가 다 실패하면 그때 isError로 화면에 반영된다.
const retryUpTo = (max: number) => (failureCount: number, error: unknown) =>
  failureCount < max && isRetryableError(error)

/**
 * 조회 데이터 유형별 캐시·재시도 정책. useQuery에 값을 직접 쓰지 말고 여기서 골라 펼친다
 * — `useQuery({ queryKey, queryFn, ...queryPolicy.catalog })`.
 * 새 유형이 필요하면 값을 하드코딩하지 말고 여기에 추가한다.
 */
export const queryPolicy = {
  // 상품 목록·검색·상세, 관리자 표의 회원 이름 — 몇 분 사이엔 거의 안 바뀌는 데이터. 5분간 캐시를 그대로 쓴다.
  catalog: { staleTime: 5 * 60_000, retry: retryUpTo(2) },
  // 프로필·기본 배송지 — 내가 바꿀 때만 바뀌고, 저장 응답으로 캐시를 직접 갱신한다
  // (useUpdateProfile 등). 비로그인 401은 isRetryableError가 걸러 재시도하지 않는다.
  account: { staleTime: 5 * 60_000, retry: retryUpTo(1) },
  // 장바구니·알림 개수 — 다른 화면이나 서버에서 바뀌는 값. 다시 볼 때마다 새로 묻는다.
  live: { staleTime: 0, retry: retryUpTo(1) },
  // 진행 중인 내 예약 — 오픈 순간 대기열 앞에서 나가는 조회라, 시트·상품 페이지·줄 서기 전 확인이 화면마다
  // 다시 묻지 않고 30초 캐시를 나눠 쓴다. 내 접수·취소는 무효화로 바로 반영된다.
  peak: { staleTime: 30_000, retry: retryUpTo(1) },
  // 대기열 순번 — 서버가 정한 간격(Retry-After)으로만 다시 묻는다. 마운트·포커스로 따로 묻지 않는다
  // (간격을 임의로 줄이면 안 된다). 간격은 쓰는 쪽이 refetchInterval로 응답에서 읽는다.
  polling: { staleTime: Infinity, retry: retryUpTo(2) },
} as const

// 실패가 이어져도 이보다 길게 기다리지 않는다 — 요청 타임아웃(10초)을 더해도 한 번에 약 55초라,
// 대기열이 250초 안에 4번 이상 다시 묻는다. 평소 간격이 더 길면 그 간격이 상한이다.
const BACKOFF_CAP_MS = 30_000
// 같은 순간 실패한 사용자들이 같은 순간 다시 몰리지 않게 흩는다. 위쪽으로만(최대 1.5배) 줘서
// 서버가 정한 간격보다 빨라지지 않는다.
const JITTER = 0.5
// 폴링 중이 아닐 때(첫 조회 등) 재시도 간격의 출발값 — TanStack 기본값(1초부터 두 배)과 같다.
const FIRST_RETRY_MS = 1_000

/**
 * 연속 failureCount번째 실패 뒤 다음 요청까지 기다릴 시간(ms). 평소 간격(baseMs)에서 두 배씩
 * 늘리되 상한에서 멈추고, 서버가 Retry-After를 줬으면 그보다 일찍 보내지 않는다.
 * failureCount는 TanStack retryDelay처럼 첫 실패 뒤 0이다.
 */
export const backoffDelay = (
  baseMs: number,
  failureCount: number,
  error?: unknown,
) => {
  const retryAfterMs =
    error instanceof ApiRequestError ? error.retryAfter * 1000 : 0
  const grown = Math.min(
    baseMs * 2 ** failureCount,
    Math.max(BACKOFF_CAP_MS, baseMs),
  )
  const minMs = Math.max(retryAfterMs, grown)
  const waitMs = minMs * (1 + Math.random() * JITTER)
  // 요청 모니터에 "왜 이만큼 기다리는지"를 남긴다.
  logWait({
    waitMs,
    baseMs,
    failureCount,
    retryAfterMs,
    minMs,
    maxMs: minMs * (1 + JITTER),
  })
  return waitMs
}

/**
 * 폴링 쿼리의 실패 재시도. 프리셋 뒤에 펼친다 — `...queryPolicy.live, ...pollingRetry(...)`.
 *
 * refetchInterval은 주기마다 실패 횟수를 0으로 되돌려 연속 실패를 셀 수 없어서, 실패하면
 * 한 번의 조회 안에서 계속 재시도하며 backoffDelay로 간격을 늘린다. 그동안 쿼리는 fetching에
 * 머물러 isError가 켜지지 않는다 — 실패 안내는 pollingError로 띄운다.
 *
 * - pollMs: 지금 폴링 간격. 폴링 중이 아니면(보여 줄 값이 아직 없음, 처리가 끝남, 자동 갱신 끔)
 *   null — 그때는 retries번만 다시 묻고 isError로 실패를 알린다. 재시도마다 다시 읽는다.
 * - expired: 제한 시간이 지났으면 true — 재시도를 그만둔다. 멈추는 건 쿼리를 끄는(enabled) 쪽이다.
 */
export const pollingRetry = (
  pollMs: () => number | null,
  {
    retries = 1,
    expired = () => false,
  }: { retries?: number; expired?: () => boolean } = {},
) => ({
  retry: (failureCount: number, error: unknown) => {
    if (!isRetryableError(error)) return false
    return pollMs() === null ? failureCount < retries : !expired()
  },
  retryDelay: (failureCount: number, error: unknown) =>
    backoffDelay(pollMs() ?? FIRST_RETRY_MS, failureCount, error),
})

/**
 * 정해진 간격으로 다시 받는 폴링(관리자 자동 갱신). intervalMs가 false면 자동 갱신을 끈 것이다.
 * 실패하면 그 간격에서 백오프하며 계속 다시 묻는다 — 관리자 화면은 제한 시간을 두지 않는다.
 * 보여 줄 값이 아직 없으면(첫 조회) 프리셋처럼 한 번만 다시 묻는다.
 */
export const pollEvery = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  intervalMs: number | false,
) => ({
  refetchInterval: intervalMs,
  ...pollingRetry(() =>
    intervalMs === false || queryClient.getQueryData(queryKey) === undefined
      ? null
      : intervalMs,
  ),
})

/**
 * 폴링 쿼리의 실패. 재시도가 끝났으면 error, 아직 재시도 중이면 마지막 실패 이유다.
 * 성공하면 null로 돌아온다. 화면은 이 값이 있으면 "마지막으로 받은 값"이라고 알린다.
 */
export const pollingError = ({
  error,
  failureCount,
  failureReason,
}: {
  error: unknown
  failureCount: number
  failureReason: unknown
}) => error ?? (failureCount > 0 ? failureReason : null)

/**
 * 끝나면 더 바뀌지 않는 조회(일괄 재처리 묶음 등) — 끝난 뒤엔 포커스·다시 마운트로 묻지 않는다.
 * 프리셋(live 등) 뒤에 펼친다. 무효화(invalidateQueries)는 그대로 다시 받는다.
 */
export const freezeWhenDone = <TData>(done: (data: TData) => boolean) => ({
  staleTime: ({ state: { data } }: { state: { data?: TData } }) =>
    data !== undefined && done(data) ? Infinity : 0,
})

/**
 * 폴링 응답이 지금 캐시보다 옛것이면 버린다(useQuery의 structuralSharing에 넣는다).
 * 요청은 한 키에 하나씩 나가지만, 서버 인스턴스마다 캐시·복제 시점이 달라 나중 응답이
 * 더 옛 값일 수 있다 — 명세가 version·countedAt으로 거르라고 한다. 같으면 받는다.
 */
export const keepNewer =
  <T>(orderOf: (data: T) => number) =>
  (prev: unknown, next: unknown) =>
    prev !== undefined && orderOf(next as T) < orderOf(prev as T)
      ? prev
      : replaceEqualDeep(prev, next)

// QueryClient 기본값 — 정책을 고르지 않은 쿼리도 4xx를 헛되이 재시도하지 않게 한다.
// 변경(mutation)은 같은 요청이 두 번 반영될 수 있어 자동 재시도하지 않는다. 예외는 사전예약 접수 하나 —
// 멱등키가 있어 응답을 못 받은 경우(status 0)만 한 번 다시 보낸다(useSubmitPreorder).
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
 * 낙관적은 장바구니 수량(useUpdateCartItemQuantity)과 오픈 알림 토글(useToggleOpenAlert)뿐이고
 * 나머지는 서버 확인이다.
 * 반복되면 그때 여기에 헬퍼를 만든다.
 */
