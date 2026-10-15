import { AdminMockSettings } from '@widgets/admin/mock-settings'

import * as styles from './AdminMockSettingsPage.css'

/** 외부 예약 시스템 Mock 설정(개발자 기능) */
export function AdminMockSettingsPage() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mock 설정</h1>
        <div className={styles.description}>
          외부 예약 시스템 Mock 서버의 지연·실패를 바꾸고, 결함을 걸거나 원장을
          비웁니다.
        </div>
      </div>
      <AdminMockSettings />
    </div>
  )
}
