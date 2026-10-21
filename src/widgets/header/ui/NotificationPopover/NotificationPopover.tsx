import { useEffect, useRef, type ReactNode } from 'react'

import { Bell } from 'lucide-react'

import * as headerStyles from '../Header.css'

import * as styles from './NotificationPopover.css'

export type NotificationPopoverProps = {
  /** 벨 버튼의 접근성 이름(예: '알림 5개') */
  label: string
  /** 아이콘 오른쪽 위 개수 배지. 없으면 생략 */
  badge?: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 패널 제목 줄 오른쪽 동작(예: 모두 읽음) */
  titleAction?: ReactNode
  /** 패널 바탕 — 회원 헤더는 어둡고 관리자 헤더는 밝다 */
  theme: 'dark' | 'light'
  /** 열렸을 때만 그리는 패널 내용 */
  children: ReactNode
}

/**
 * 헤더 알림 벨과 패널의 틀 — 벨을 누르면 여닫고, 바깥을 누르거나 Esc를 누르면 닫는다(Esc는
 * 벨로 포커스를 돌린다). 무엇을 보여 줄지는 회원·관리자 쪽이 children으로 넘긴다.
 */
export function NotificationPopover({
  label,
  badge,
  open,
  onOpenChange,
  titleAction,
  theme,
  children,
}: NotificationPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 열려 있는 동안만 문서를 듣는다(Dropdown과 같은 방식).
  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      onOpenChange(false)
      buttonRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onOpenChange])

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
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <Bell className={headerStyles.icon} aria-hidden="true" />
        {badge}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="알림"
          className={styles.panel}
          data-theme={theme}
        >
          <div className={styles.titleRow}>
            <span className={styles.title}>알림</span>
            {titleAction}
          </div>
          {children}
        </div>
      )}
    </div>
  )
}
