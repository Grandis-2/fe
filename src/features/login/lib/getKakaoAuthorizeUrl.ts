import { isMockEnabled } from '@shared/api/mock'

import { createAndStoreState, storeReturnTo } from './kakaoState'

const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize'

// 카카오 개발자 콘솔의 Redirect URI에 이 경로(+ 현재 origin)를 등록해 둬야 한다.
export const KAKAO_CALLBACK_PATH = '/auth/kakao/callback'

export function getKakaoAuthorizeUrl() {
  // state는 콜백 페이지가 sessionStorage 값과 대조해서 검증한다.
  const state = createAndStoreState()
  // 콜백 완료 후 로그인을 시작한 화면으로 되돌아가기 위해 지금 경로를 같이 저장한다.
  storeReturnTo(`${window.location.pathname}${window.location.search}`)

  // ponytail: 백엔드 연동 전엔 카카오를 거치지 않는다 — 카카오가 돌려줄 콜백 URL을 직접
  // 만들고 MSW가 가짜 code로 세션을 발급한다. 실제 API에 붙일 땐 VITE_USE_MSW=false.
  if (isMockEnabled) {
    const code = `mock-${crypto.randomUUID()}`
    return `${KAKAO_CALLBACK_PATH}?${new URLSearchParams({ code, state })}`
  }

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_KAKAO_OAUTH_REST_API_KEY,
    redirect_uri: `${window.location.origin}${KAKAO_CALLBACK_PATH}`,
    response_type: 'code',
    state,
  })
  return `${KAKAO_AUTHORIZE_URL}?${params.toString()}`
}
