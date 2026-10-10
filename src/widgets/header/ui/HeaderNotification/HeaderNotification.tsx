import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Bell } from 'lucide-react'
import { Link } from 'react-router'

import {
  formatNotificationTime,
  useNotifications,
} from '@entities/notification'

import * as headerStyles from '../Header.css'

import * as styles from './HeaderNotification.css'

export type HeaderNotificationProps = {
  /** 안 읽은 개수를 담은 접근성 이름(예: '알림 5개') */
  label: string
  /** 아이콘 오른쪽 위 개수 배지 — 헤더의 다른 배지와 같은 모양이라 헤더가 만들어 넘긴다 */
  badge: ReactNode
}

// 벨을 누를 때마다 알림 패널을 여닫는다. 바깥을 누르거나 Esc를 눌러도 닫힌다.
export function HeaderNotification({ label, badge }: HeaderNotificationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { data: notifications, isPending, isError } = useNotifications(isOpen)

  // 열려 있는 동안만 문서를 듣는다(Dropdown과 같은 방식).
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      buttonRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const renderList = () => {
    if (isPending) return <div className={styles.status}>불러오는 중…</div>
    if (isError)
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
                  onClick={() => setIsOpen(false)}
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

  return (
    // 헤더의 다른 아이콘처럼 높이를 꽉 채워야 버튼이 헤더 높이만큼 잡힌다.
    <div ref={rootRef} className={headerStyles.fill}>
      <button
        ref={buttonRef}
        type="button"
        className={[headerStyles.iconButton, headerStyles.badgeAnchor].join(
          ' ',
        )}
        aria-label={label}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell className={headerStyles.icon} aria-hidden="true" />
        {badge}
      </button>
      {isOpen && (
        <div
          role="dialog"
          aria-label="알림"
          className={styles.panel}
          data-theme="dark"
        >
          <div className={styles.title}>알림</div>
          {renderList()}
        </div>
      )}
    </div>
  )
}
