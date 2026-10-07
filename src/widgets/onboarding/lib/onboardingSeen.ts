// 같은 localhost에서 도는 다른 앱과 키가 겹치지 않게 앞에 붙인다.
const STORAGE_KEY = 'nova:onboardingSeen'

// 시크릿 창·저장소 차단이면 읽기가 던진다 — 그땐 본 것으로 쳐서 홈 진입을 막지 않는다.
export const hasSeenOnboarding = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

export const markOnboardingSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // 저장하지 못하면 다음 방문에 한 번 더 보일 뿐이다.
  }
}
