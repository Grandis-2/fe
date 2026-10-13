import { Link } from 'react-router'

import {
  formatNotificationTime,
  type NotificationItem,
} from '@entities/notification'

import * as styles from './NotificationList.css'

export type NotificationListProps = {
  /** 조회 결과. 실패하면 undefined로 두고 isError로 알린다(빈 배열로 대신하지 않는다). */
  notifications: NotificationItem[] | undefined
  isPending: boolean
  isError: boolean
  /** 링크가 있는 알림을 눌러 이동할 때 — 패널을 닫는다 */
  onNavigate?: () => void
}

// 알림 패널 안의 목록. 조회는 패널(HeaderNotification)이 하고, 여기선 상태별로 그리기만 한다 —
// 그래서 MSW 없는 Storybook에서도 불러오는 중·실패·빈 목록·목록을 각각 보여 줄 수 있다.
export function NotificationList({
  notifications,
  isPending,
  isError,
  onNavigate,
}: NotificationListProps) {
  if (isPending) return <div className={styles.status}>불러오는 중…</div>
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

        return (
          <li key={notification.notificationId}>
            {notification.link ? (
              <Link
                to={notification.link}
                className={styles.item}
                onClick={onNavigate}
              >
                {content}
              </Link>
            ) : (
              <div className={styles.item}>{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
