import { useState } from 'react'

import { NotificationPopover } from '../NotificationPopover'

import * as styles from './AdminNotification.css'

/**
 * 관리자 알림 — 회원 알림과 대상이 달라 따로 둔다. 벨을 누르면 밝은 패널이 열린다.
 * ponytail: 관리자 알림 API가 없어 빈 패널만 그린다. API가 생기면 목록·안 읽은 배지를 붙인다.
 */
export function AdminNotification() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <NotificationPopover
      label="알림"
      open={isOpen}
      onOpenChange={setIsOpen}
      theme="light"
    >
      <div className={styles.empty}>새 알림이 없어요.</div>
    </NotificationPopover>
  )
}
