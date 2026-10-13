import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getNotifications } from './notification'

// 헤더 알림 패널용. 패널을 열 때만 묻는다 — 닫혀 있는 동안은 배지 개수로 충분하다.
export const useNotifications = (enabled: boolean) =>
  useQuery({
    queryKey: ['notifications', 'list'] as const,
    queryFn: async ({ signal }) => (await getNotifications(signal)).items,
    enabled,
    ...queryPolicy.live,
  })
