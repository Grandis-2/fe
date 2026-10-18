import { http } from 'msw'

import { hitsMockFault } from '../fault'
import { fail } from '../response'
import { url } from '../url'

// 페이지 주소에 ?mock=500(또는 503 등 다른 상태 코드, error는 500)을 붙이면 모든 API가
// 그 상태로 실패한다 — 서버 장애 화면 확인용(예: /products/1?mock=500).
// MSW 브라우저 핸들러는 페이지에서 돌아서 location으로 페이지 주소를 읽을 수 있다.
// 요청 모니터의 [장애 내기]로 고른 요청(hitsMockFault)도 503으로 실패한다.
// 둘 다 아니면 undefined를 돌려 원래 핸들러로 넘긴다.
export const forceErrorHandler = http.all(url('/api/*'), ({ request }) => {
  const mock = new URLSearchParams(location.search).get('mock')
  const status = hitsMockFault(request.method, new URL(request.url).pathname)
    ? 503
    : mock === 'error'
      ? 500
      : Number(mock)
  if (!(status >= 400 && status <= 599)) return undefined

  return fail(status, {
    code: 'MOCK_ERROR',
    message: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  })
})
