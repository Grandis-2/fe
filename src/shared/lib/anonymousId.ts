const STORAGE_KEY = 'nova:anonymousId'

// 조회·검색 신호에 넣는 브라우저 익명 id. 한 번 만들어 저장해 두고 계속 같은 값을 쓴다(로그인해도 같이 보낸다).
// 저장소가 막혔으면(시크릿 창 등) 이번 탭에서만 같은 값을 쓴다.
let memo: string | undefined

export const getAnonymousId = () => {
  if (memo) return memo
  try {
    memo = localStorage.getItem(STORAGE_KEY) ?? crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, memo)
  } catch {
    memo ??= crypto.randomUUID()
  }
  return memo
}
