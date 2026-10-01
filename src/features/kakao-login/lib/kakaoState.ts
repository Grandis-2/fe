// CSRF 방지용 state — 탭별 sessionStorage에 둔다. localStorage는 다른 탭·다음
// 세션까지 남아서 금지(11-frontend-guide.md §3).
const STATE_KEY = 'kakao_oauth_state'
// 로그인 시작 전 페이지로 콜백 후 돌아가기 위한 경로. state와 같은 생애주기라 같이 저장/소비한다.
const RETURN_TO_KEY = 'kakao_oauth_return_to'

export function createAndStoreState(): string {
  // UUID 하나(32자)로도 요구치(32자 이상)는 채우지만, 여유를 두려고 두 개를 잇는다.
  const state =
    crypto.randomUUID().replace(/-/g, '') +
    crypto.randomUUID().replace(/-/g, '')
  try {
    sessionStorage.setItem(STATE_KEY, state)
  } catch {
    // 시크릿 모드의 저장소 제한 등으로 못 쓰면, state를 검증할 방법이 없어
    // 로그인을 시작해도 콜백에서 반드시 실패한다 — 여기서 바로 막는다.
    throw new Error(
      '브라우저 저장소를 사용할 수 없어 로그인을 시작할 수 없습니다.',
    )
  }
  return state
}

// 저장한 state는 검증 성공/실패와 무관하게 즉시 지운다 — 한 번 쓴 state는 버린다.
export function consumeStoredState(returnedState: string | null): boolean {
  try {
    const stored = sessionStorage.getItem(STATE_KEY)
    sessionStorage.removeItem(STATE_KEY)
    return stored !== null && returnedState !== null && stored === returnedState
  } catch {
    // 저장소를 못 읽으면 검증 불가 — 안전하게 실패로 처리한다.
    return false
  }
}

// 로그인 시작 시점의 경로(+쿼리)를 저장해 콜백 완료 후 그 자리로 돌려보낸다.
export function storeReturnTo(path: string) {
  try {
    sessionStorage.setItem(RETURN_TO_KEY, path)
  } catch {
    // 저장에 실패해도 로그인 자체는 계속 진행한다 — consumeReturnTo가 홈으로 대체한다.
  }
}

// 오픈 리다이렉트 방지 — 내부 경로('/'로 시작하고 '//'는 아님)가 아니면 홈으로 보낸다.
export function consumeReturnTo(): string {
  try {
    const stored = sessionStorage.getItem(RETURN_TO_KEY)
    sessionStorage.removeItem(RETURN_TO_KEY)
    return stored && stored.startsWith('/') && !stored.startsWith('//')
      ? stored
      : '/'
  } catch {
    return '/'
  }
}
