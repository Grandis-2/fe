import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { NotificationItem } from '@shared/api/types'

import {
  getNotifications,
  readAllNotifications,
  readNotification,
} from './notification'

export const notificationKeys = {
  list: ['notifications', 'list'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

// 헤더 알림 패널용. 패널을 열 때만 묻는다 — 닫혀 있는 동안은 배지 개수로 충분하다.
export const useNotifications = (enabled: boolean) =>
  useQuery({
    queryKey: notificationKeys.list,
    queryFn: async ({ signal }) => (await getNotifications(signal)).items,
    enabled,
    ...queryPolicy.live,
  })

// 읽음은 실시간 연결로 오지 않는다(명세) — 204를 받으면 화면의 항목과 배지를 직접 맞춘다.
const markRead = (
  list: NotificationItem[] | undefined,
  isTarget: (item: NotificationItem) => boolean,
) => list?.map((item) => (isTarget(item) ? { ...item, read: true } : item))

// 안 읽은 알림을 눌렀을 때만 부른다 — 이미 읽은 알림은 배지를 줄이지 않는다.
export const useReadNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: readNotification,
    onSuccess: (_, notificationId) => {
      // 같은 알림을 연달아 눌러 204가 두 번 와도 배지는 한 번만 줄인다.
      const wasUnread =
        queryClient
          .getQueryData<NotificationItem[]>(notificationKeys.list)
          ?.some(
            (item) => item.notificationId === notificationId && !item.read,
          ) ?? true
      queryClient.setQueryData<NotificationItem[]>(
        notificationKeys.list,
        (list) =>
          markRead(list, (item) => item.notificationId === notificationId),
      )
      if (wasUnread)
        queryClient.setQueryData<number>(
          notificationKeys.unreadCount,
          (count) => (count === undefined ? count : Math.max(0, count - 1)),
        )
    },
    // 404는 없는 알림이거나 내 알림이 아니다 — 목록과 배지를 다시 받아 맞춘다.
    onError: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export const useReadAllNotifications = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: readAllNotifications,
    onSuccess: () => {
      queryClient.setQueryData<NotificationItem[]>(
        notificationKeys.list,
        (list) => markRead(list, () => true),
      )
      queryClient.setQueryData<number>(notificationKeys.unreadCount, 0)
    },
  })
}
