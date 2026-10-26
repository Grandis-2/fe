import { AdminMockSettings } from '@widgets/admin/mock-settings'

import * as styles from './AdminMockSettingsPage.css'

/** 외부 예약 시스템 Mock 설정(개발자 기능). 제목 줄은 적용 버전·갱신과 함께 위젯이 그린다 */
export function AdminMockSettingsPage() {
  return (
    <div className={styles.root}>
      <AdminMockSettings
        header={{
          title: 'Mock 설정',
          // 바꾸기 전에 먼저 읽히게 제목 바로 옆에 둔다.
          description:
            '외부 예약 시스템 Mock의 응답 속도와 실패를 바꾸고, 한 건에 결함을 걸거나 원장을 비워요.',
        }}
      />
    </div>
  )
}
