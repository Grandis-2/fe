import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Bell } from 'lucide-react'

import { useNotifications } from '@entities/notification'

import * as headerStyles from '../Header.css'
import { NotificationList } from '../NotificationList'

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
          <NotificationList
            notifications={notifications}
            isPending={isPending}
            isError={isError}
            onNavigate={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
