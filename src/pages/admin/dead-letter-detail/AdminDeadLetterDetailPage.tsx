import { useLocation, useParams } from 'react-router'

import {
  deadLetterEventLabel,
  useDeadLetter,
} from '@entities/admin-dead-letter'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_DEAD_LETTERS_PATH, readBackTo } from '@shared/config/routes'
import {
  Breadcrumb,
  InlineAlert,
  PageSkeleton,
  RefreshStatus,
} from '@shared/ui'
import { AdminDeadLetterDetail } from '@widgets/admin/dead-letters'

import * as styles from './AdminDeadLetterDetailPage.css'

/** 주소에서 메시지를 읽어 상세 위젯에 넘긴다. 조회 실패·로딩·갱신 시각은 여기서 보여준다 */
export function AdminDeadLetterDetailPage() {
  const { deadLetterId = '' } = useParams()
  const deadLetter = useDeadLetter(deadLetterId)
  // 목록에서 들어왔으면 고른 조건 그대로의 목록으로 돌아간다.
  const backTo = readBackTo(useLocation().state) ?? {
    label: '이벤트 DLQ',
    to: ADMIN_DEAD_LETTERS_PATH,
  }

  if (!deadLetter.data) {
    // 불러오는 중이면 화면 모양을 먼저 깐다 — 실패일 때만 안내와 돌아갈 길을 보인다.
    if (!deadLetter.isError) {
      return (
        <div className={styles.root}>
          <PageSkeleton sections={2} fieldsPerSection={2} />
        </div>
      )
    }
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          {getErrorMessage(deadLetter.error, '메시지를 불러오지 못했습니다.')}
          <Breadcrumb
            items={[
              { label: `${backTo.label} 화면으로 돌아가기`, to: backTo.to },
            ]}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <Breadcrumb
          items={[
            { label: backTo.label, to: backTo.to },
            { label: deadLetterEventLabel(deadLetter.data.eventType) },
          ]}
        />
        {/* 되돌리기 결과를 기다리는 동안만 저절로 다시 받는다(useDeadLetter). */}
        <RefreshStatus
          updatedAt={deadLetter.dataUpdatedAt}
          onRefresh={() => void deadLetter.refetch()}
        />
      </div>

      {deadLetter.isError && (
        <InlineAlert status="warning">
          {getErrorMessage(
            deadLetter.error,
            '메시지를 다시 불러오지 못했습니다.',
          )}{' '}
          아래 내용은 마지막으로 받은 값입니다.
        </InlineAlert>
      )}

      <AdminDeadLetterDetail deadLetter={deadLetter.data} />
    </div>
  )
}
