import { Link } from 'react-router'

import {
  formatNotificationTime,
  notificationPath,
  type NotificationItem,
} from '@entities/notification'
import { useEndReached } from '@shared/lib/useEndReached'
import { Button, Skeleton, SkeletonGroup } from '@shared/ui'

import * as styles from './NotificationList.css'

export type NotificationListProps = {
  /** 조회 결과. 실패하면 undefined로 두고 isError로 알린다(빈 배열로 대신하지 않는다). */
  notifications: NotificationItem[] | undefined
  isPending: boolean
  isError: boolean
  /** 갈 곳이 있는 알림을 눌러 이동할 때 — 읽음 처리하고 패널을 닫는다 */
  onSelect?: (notification: NotificationItem) => void
  /** 다음 쪽이 있다 — 목록 끝까지 내리면 onLoadMore를 부른다 */
  hasMore?: boolean
  /** 다음 쪽을 받는 중 */
  isLoadingMore?: boolean
  /** 다음 쪽을 못 받았다 — 스크롤로 계속 두드리지 않고 끝에 다시 받기 버튼을 둔다 */
  isLoadMoreError?: boolean
  onLoadMore?: () => void
}

const skeletonRows = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <div key={i} className={styles.item}>
      <span />
      <Skeleton height={40} />
    </div>
  ))

// 알림 패널 안의 목록. 조회는 패널(HeaderNotification)이 하고, 여기선 상태별로 그리기만 한다 —
// 그래서 MSW 없는 Storybook에서도 불러오는 중·실패·빈 목록·목록을 각각 보여 줄 수 있다.
export function NotificationList({
  notifications,
  isPending,
  isError,
  onSelect,
  hasMore = false,
  isLoadingMore = false,
  isLoadMoreError = false,
  onLoadMore,
}: NotificationListProps) {
  const endRef = useEndReached<HTMLLIElement>(
    hasMore && !isLoadingMore && !isLoadMoreError,
    () => onLoadMore?.(),
  )

  if (isPending) return <SkeletonGroup>{skeletonRows(3)}</SkeletonGroup>
  if (isError || !notifications)
    return <div className={styles.status}>알림을 불러오지 못했어요.</div>
  if (notifications.length === 0)
    return <div className={styles.status}>새 알림이 없어요.</div>

  return (
    <ul className={styles.list}>
      {notifications.map((notification) => {
        const content = (
          <>
            {/* 역할 없는 span의 aria-label은 읽히지 않을 수 있어 점에 img 역할을 준다. */}
            <span
              className={notification.read ? undefined : styles.unreadDot}
              role={notification.read ? undefined : 'img'}
              aria-label={notification.read ? undefined : '안 읽음'}
            />
            <span className={styles.body}>
              <span className={styles.itemHeader}>
                <span
                  className={[
                    styles.itemTitle,
                    notification.read && styles.read,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {notification.title}
                </span>
                <span className={styles.time}>
                  {formatNotificationTime(notification.createdAt)}
                </span>
              </span>
              <span className={styles.message}>{notification.message}</span>
            </span>
          </>
        )

        // ponytail: 갈 곳이 없는 알림은 눌러도 읽음이 되지 않는다 — "모두 읽음"으로 지운다.
        const path = notificationPath(notification.target)
        return (
          <li key={notification.notificationId}>
            {path ? (
              <Link
                to={path}
                className={styles.item}
                onClick={() => onSelect?.(notification)}
              >
                {content}
              </Link>
            ) : (
              <div className={styles.item}>{content}</div>
            )}
          </li>
        )
      })}
      {isLoadingMore && (
        <li>
          <SkeletonGroup>{skeletonRows(1)}</SkeletonGroup>
        </li>
      )}
      {isLoadMoreError && (
        <li className={styles.loadMoreError}>
          알림을 더 불러오지 못했어요.
          <Button
            variant="subtle"
            color="secondary"
            size="small"
            onClick={onLoadMore}
          >
            다시 불러오기
          </Button>
        </li>
      )}
      {/* 패널 안에서 끝까지 내리면 다음 쪽을 받는다. */}
      {hasMore && <li ref={endRef} aria-hidden="true" />}
    </ul>
  )
}
