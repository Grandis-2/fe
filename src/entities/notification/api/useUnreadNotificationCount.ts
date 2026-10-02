import { useQuery } from '@tanstack/react-query'

import { pollingInterval, queryPolicy } from '@shared/api/queryPolicy'

import { getUnreadNotificationCount } from './notification'

// 알림은 사용자 행동과 상관없이 서버에서 생기므로 주기적으로 다시 묻는다.
// 실패가 이어지면 pollingInterval이 간격을 늘린다(최대 8분).
const POLL_INTERVAL_MS = 60_000

// 헤더 알림 배지용. 비회원은 알림이 없으니 요청하지 않는다.
export const useUnreadNotificationCount = (enabled: boolean) =>
  useQuery({
    queryKey: ['notifications', 'unread-count'] as const,
    queryFn: ({ signal }) => getUnreadNotificationCount(signal),
    enabled,
    ...queryPolicy.live,
    refetchInterval: pollingInterval(POLL_INTERVAL_MS),
  })
