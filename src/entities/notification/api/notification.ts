import { apiClient } from '@shared/api/client'
import type { CountResponse } from '@shared/api/types'

export const getUnreadNotificationCount = async (signal?: AbortSignal) => {
  const { count } = await apiClient.request<CountResponse>(
    '/api/v1/notifications/unread-count',
    { signal },
  )
  return count
}
