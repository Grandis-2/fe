import { AdminRecovery } from '@widgets/admin/recovery'

import * as styles from './AdminRecoveryPage.css'

/** 외부 등록 장애 대응 — 원인 확인 → 다시 보내기 → 회복 확인 */
export function AdminRecoveryPage() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>외부 등록 장애 대응</h1>
        <div className={styles.description}>
          자동 재시도를 다 쓰고 멈춘 예약을 원인별로 묶어 다시 보내요. 위에서
          아래로 따라가면 돼요.
        </div>
      </div>
      <AdminRecovery />
    </div>
  )
}
