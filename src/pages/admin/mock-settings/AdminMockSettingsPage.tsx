import { Tag } from '@shared/ui'
import { AdminMockSettings } from '@widgets/admin/mock-settings'

import * as styles from './AdminMockSettingsPage.css'

/** 외부 예약 시스템 Mock 설정(개발자 기능) */
export function AdminMockSettingsPage() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Mock 설정</h1>
          {/* 바꾸기 전에 먼저 읽히게 제목 바로 옆에 둔다. */}
          <Tag variant="subtle" color="yellow" size="medium">
            팀 공용 서버 — 바꾸면 모두에게 바로 적용
          </Tag>
        </div>
        <div className={styles.description}>
          외부 예약 시스템 Mock의 응답 속도와 실패를 바꾸고, 한 건에 결함을
          걸거나 원장을 비워요.
        </div>
      </div>
      <AdminMockSettings />
    </div>
  )
}
