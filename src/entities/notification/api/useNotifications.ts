import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { NotificationItem, NotificationList } from '@shared/api/types'

import {
  getNotifications,
  readAllNotifications,
  readNotification,
} from './notification'

export const notificationKeys = {
  list: ['notifications', 'list'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

type NotificationPages = InfiniteData<NotificationList, string | undefined>

// 헤더 알림 패널용. 패널을 열 때만 묻는다 — 닫혀 있는 동안은 배지 개수로 충분하다.
// 패널 끝에 닿으면 fetchNextPage로 nextCursor의 다음 쪽을 붙인다(무한 스크롤).
export const useNotifications = (enabled: boolean) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam, signal }) => getNotifications(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: ({ nextCursor }) => nextCursor ?? undefined,
    enabled,
    ...queryPolicy.live,
  })

// 읽음은 실시간 연결로 오지 않는다(명세) — 204를 받으면 받아 둔 모든 쪽의 항목과 배지를 직접 맞춘다.
const markRead = (
  data: NotificationPages | undefined,
  isTarget: (item: NotificationItem) => boolean,
) =>
  data && {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        isTarget(item) ? { ...item, read: true } : item,
      ),
    })),
  }

// 안 읽은 알림을 눌렀을 때만 부른다 — 이미 읽은 알림은 배지를 줄이지 않는다.
export const useReadNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: readNotification,
    onSuccess: (_, notificationId) => {
      // 같은 알림을 연달아 눌러 204가 두 번 와도 배지는 한 번만 줄인다.
      const wasUnread =
        queryClient
          .getQueryData<NotificationPages>(notificationKeys.list)
          ?.pages.some((page) =>
            page.items.some(
              (item) => item.notificationId === notificationId && !item.read,
            ),
          ) ?? true
      queryClient.setQueryData<NotificationPages>(
        notificationKeys.list,
        (data) =>
          markRead(data, (item) => item.notificationId === notificationId),
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
      queryClient.setQueryData<NotificationPages>(
        notificationKeys.list,
        (data) => markRead(data, () => true),
      )
      queryClient.setQueryData<number>(notificationKeys.unreadCount, 0)
    },
  })
}
