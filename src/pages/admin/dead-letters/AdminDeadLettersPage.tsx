import { AdminDeadLetterList } from '@widgets/admin/dead-letters'

import * as styles from './AdminDeadLettersPage.css'

/** 이벤트 DLQ(개발자 기능). 제목 줄·조건·목록·일괄 되돌리기는 위젯이 맡는다 */
export function AdminDeadLettersPage() {
  return (
    <div className={styles.root}>
      <AdminDeadLetterList
        header={{
          title: '이벤트 DLQ',
          description:
            '서버끼리 주고받는 메시지 중 처리에 거듭 실패해 멈춘 것이에요. 평소엔 비어 있어야 해요. 원인을 고친 뒤 되돌리거나, 다시 처리하면 안 되는 메시지는 사유를 남기고 버려요.',
        }}
      />
    </div>
  )
}
