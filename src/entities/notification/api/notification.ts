import { apiClient } from '@shared/api/client'
import type { CountResponse, NotificationList } from '@shared/api/types'

export const getUnreadNotificationCount = async (signal?: AbortSignal) => {
  const { count } = await apiClient.request<CountResponse>(
    '/api/v1/notifications/unread-count',
    { signal },
  )
  return count
}

export const getNotifications = (signal?: AbortSignal) =>
  apiClient.request<NotificationList>('/api/v1/notifications', { signal })
