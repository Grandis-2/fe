import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// 브라우저는 Service Worker가 만든 합성 응답의 Set-Cookie를 실제 쿠키로 반영하지
// 않는다(임의의 SW가 쿠키를 심는 걸 막는 의도된 보안 제약 — MSW 한계가 아니다).
// 그래서 핸들러는 실제 쿠키 값을 커스텀 헤더(X-Mock-Set-Cookie)로 대신 내려보내고,
// 여기 페이지 컨텍스트(document 접근 가능)에서 대신 심어 준다. HttpOnly는 흉내낼
// 수 없어(document.cookie로 못 켠다) 로컬 목업에서만 겪는 한계다 — 실제 서버는
// 진짜 Set-Cookie로 HttpOnly가 정상 적용된다.
worker.events.on('response:mocked', ({ response }) => {
  const cookie = response.headers.get('X-Mock-Set-Cookie')
  if (cookie) document.cookie = cookie
})
