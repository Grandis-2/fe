import { AdminLoadTest } from '@widgets/admin/load-test'

import * as styles from './AdminLoadTestPage.css'

/** 부하 검증(개발자 기능) — 시험 중 서비스 상태를 지켜본다 */
export function AdminLoadTestPage() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>부하 검증</h1>
        <div className={styles.description}>
          부하를 거는 동안 대기열, 예약 처리, 외부 등록이 어떻게 버티는지
          봅니다. 서버 지표(TPS·응답 시간·에러율)는 Grafana에서 봅니다.
        </div>
      </div>
      <AdminLoadTest />
    </div>
  )
}
