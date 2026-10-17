import { QueryClient } from '@tanstack/react-query'

import { onSessionCleared } from '@entities/auth'
import { defaultQueryOptions } from '@shared/api/queryPolicy'

export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
})

// 회원 데이터(프로필·장바구니·주문 등) 캐시 키엔 사용자 구분이 없다 — 세션이 끊기면 통째로
// 버려야 다음에 로그인한 사람이 이전 회원의 값을 캐시로 보지 않는다.
onSessionCleared(() => queryClient.clear())
