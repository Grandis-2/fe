import { QueryClient } from '@tanstack/react-query'

import { onSessionCleared } from '@entities/auth'
import { usePreorderQueueStore } from '@features/preorder-queue'
import { defaultQueryOptions } from '@shared/api/queryPolicy'
import { showToast } from '@shared/model/toastStore'

export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
})

// 회원 데이터(프로필·장바구니·주문 등) 캐시 키엔 사용자 구분이 없다 — 세션이 끊기면 통째로
// 버려야 다음에 로그인한 사람이 이전 회원의 값을 캐시로 보지 않는다.
onSessionCleared(() => {
  queryClient.clear()
  // 대기열 줄·입장권(메모리 + sessionStorage)도 회원 것이다 — 남기면 줄 조회가 계속 돌고, 다음 회원이 앞 회원의
  // 알약·입장권을 이어받아 '입장권 무효'만 본다.
  const { ticket, clear, clearAdmission } = usePreorderQueueStore.getState()
  if (ticket) showToast('로그아웃되어 대기열을 닫았어요.')
  clear()
  clearAdmission()
})
