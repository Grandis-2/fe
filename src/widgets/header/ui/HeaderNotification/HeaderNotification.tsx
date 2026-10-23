import { useState, type ReactNode } from 'react'

import {
  useNotifications,
  useReadAllNotifications,
  useReadNotification,
} from '@entities/notification'
import { getErrorMessage } from '@shared/api/client'
import { showToast } from '@shared/model/toastStore'
import { Button } from '@shared/ui'

import { NotificationList } from '../NotificationList'
import { NotificationPopover } from '../NotificationPopover'

export type HeaderNotificationProps = {
  /** 안 읽은 개수를 담은 접근성 이름(예: '알림 5개') */
  label: string
  /** 아이콘 오른쪽 위 개수 배지 — 헤더의 다른 배지와 같은 모양이라 헤더가 만들어 넘긴다 */
  badge: ReactNode
}

/** 회원 알림 — 벨을 열 때만 목록을 받고, 끝까지 내리면 다음 쪽을 붙이고, 고르면 읽음 처리하고 닫는다 */
export function HeaderNotification({ label, badge }: HeaderNotificationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    data,
    isPending,
    isError,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useNotifications(isOpen)
  const notifications = data?.pages.flatMap(({ items }) => items)
  const readNotification = useReadNotification()
  const readAll = useReadAllNotifications()
  const hasUnread = notifications?.some((item) => !item.read) ?? false

  return (
    <NotificationPopover
      label={label}
      badge={badge}
      open={isOpen}
      onOpenChange={setIsOpen}
      theme="dark"
      titleAction={
        hasUnread && (
          <Button
            variant="subtle"
            color="secondary"
            size="small"
            disabled={readAll.isPending}
            onClick={() =>
              readAll.mutate(undefined, {
                onError: (caught) =>
                  showToast(
                    getErrorMessage(caught, '알림을 읽음으로 바꾸지 못했어요.'),
                  ),
              })
            }
          >
            모두 읽음
          </Button>
        )
      }
    >
      {/* 읽음 처리를 기다리지 않고 바로 이동한다 — 실패하면 목록·배지를 다시 받아 맞춘다. */}
      <NotificationList
        notifications={notifications}
        isPending={isPending}
        // 다음 쪽 실패도 isError가 켜지므로, 받은 게 없을 때만 목록 실패로 본다.
        isError={isError && !notifications}
        hasMore={hasNextPage}
        isLoadingMore={isFetchingNextPage}
        isLoadMoreError={isFetchNextPageError}
        onLoadMore={() => void fetchNextPage()}
        onSelect={(notification) => {
          if (!notification.read)
            readNotification.mutate(notification.notificationId)
          setIsOpen(false)
        }}
      />
    </NotificationPopover>
  )
}
