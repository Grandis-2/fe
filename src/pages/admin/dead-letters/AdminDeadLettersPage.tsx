import { AdminDeadLetterList } from '@widgets/admin/dead-letters'

import * as styles from './AdminDeadLettersPage.css'

/** 이벤트 DLQ(개발자 기능). 조건·목록·일괄 되돌리기는 위젯이 맡는다 */
export function AdminDeadLettersPage() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>이벤트 DLQ</h1>
        <div className={styles.description}>
          서버끼리 주고받는 메시지 중 처리에 거듭 실패해 멈춘 것입니다. 원인을
          고친 뒤 되돌리거나, 다시 처리하면 안 되는 메시지는 사유를 남기고
          버립니다.
        </div>
      </div>
      <AdminDeadLetterList />
    </div>
  )
}
