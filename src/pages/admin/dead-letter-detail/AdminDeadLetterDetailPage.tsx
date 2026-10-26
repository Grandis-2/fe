import { useLocation, useParams, useSearchParams } from 'react-router'

import {
  deadLetterEventLabel,
  toDeadLetterService,
  useDeadLetter,
} from '@entities/admin-dead-letter'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import { adminDeadLettersPath, readBackTo } from '@shared/config/routes'
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
  // 결제 DLQ 메시지는 ?service=payment로 온다.
  const service = toDeadLetterService(useSearchParams()[0].get('service'))
  const deadLetter = useDeadLetter(service, deadLetterId)
  // 목록에서 들어왔으면 고른 조건 그대로의 목록으로 돌아간다.
  const backTo = readBackTo(useLocation().state) ?? {
    label: '이벤트 DLQ',
    to: adminDeadLettersPath(service),
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

      {/* 다시 묻는(백오프) 동안엔 isError가 켜지지 않아 pollingError로 본다. */}
      {pollingError(deadLetter) !== null && (
        <InlineAlert status="warning">
          {getErrorMessage(
            pollingError(deadLetter),
            '메시지를 다시 불러오지 못했습니다.',
          )}{' '}
          아래 내용은 마지막으로 받은 값입니다.
        </InlineAlert>
      )}

      <AdminDeadLetterDetail
        deadLetter={deadLetter.data}
        service={service}
        stalled={deadLetter.stalled}
      />
    </div>
  )
}
