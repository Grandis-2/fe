import { useLocation, useParams } from 'react-router'

import { useAdminReservation } from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import { ADMIN_RESERVATIONS_PATH, readBackTo } from '@shared/config/routes'
import {
  Breadcrumb,
  InlineAlert,
  PageSkeleton,
  RefreshStatus,
} from '@shared/ui'
import { AdminReservationDetail } from '@widgets/admin/reservation-detail'

import * as styles from './AdminReservationDetailPage.css'

/** 주소에서 예약을 읽어 상세 위젯에 넘긴다. 조회 실패·로딩·갱신 시각은 여기서 보여준다 */
export function AdminReservationDetailPage() {
  const { preorderId = '' } = useParams()
  const reservation = useAdminReservation(preorderId)
  // 외부 예약 대조에서 들어왔으면 그 화면(고른 상품·탭 그대로)으로 돌아간다.
  const backTo = readBackTo(useLocation().state) ?? {
    label: '예약 현황',
    to: ADMIN_RESERVATIONS_PATH,
  }

  if (!reservation.data) {
    // 불러오는 중이면 화면 모양을 먼저 깐다 — 실패일 때만 안내와 돌아갈 길을 보인다.
    if (!reservation.isError) {
      return (
        <div className={styles.root}>
          <PageSkeleton sections={3} fieldsPerSection={2} />
        </div>
      )
    }
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          {getErrorMessage(reservation.error, '예약을 불러오지 못했습니다.')}
          <Breadcrumb
            items={[
              { label: `${backTo.label} 화면으로 돌아가기`, to: backTo.to },
            ]}
          />
        </div>
      </div>
    )
  }

  // 취소가 끝난 예약은 더 바뀔 게 없어 자동 갱신을 멈춘다(useAdminReservation).
  const polling = reservation.data.status !== 'CANCELED'
  // 재시도 중에도 알린다 — 다시 묻는 동안엔 isError가 켜지지 않는다(pollingRetry).
  const staleError = pollingError(reservation)

  return (
    <div className={styles.root}>
      {/* 제목 줄엔 조치 버튼이 있어 마지막 갱신은 한 줄 위 오른쪽에 둔다. */}
      <div className={styles.topBar}>
        <Breadcrumb
          items={[
            { label: backTo.label, to: backTo.to },
            { label: reservation.data.productTitle },
          ]}
        />
        <RefreshStatus
          updatedAt={reservation.dataUpdatedAt}
          onRefresh={() => void reservation.refetch()}
          note={
            polling
              ? '10초마다 자동 갱신'
              : '취소된 예약이라 자동 갱신하지 않음'
          }
        />
      </div>

      {/* 갱신이 실패해도 이전 값은 남아 화면에 보인다 — 멈춘 값을 최신으로 읽지 않게 알린다. */}
      {staleError !== null && (
        <InlineAlert status="warning">
          {getErrorMessage(staleError, '예약을 다시 불러오지 못했습니다.')} 아래
          내용은 마지막으로 받은 값입니다.
        </InlineAlert>
      )}

      <AdminReservationDetail reservation={reservation.data} />
    </div>
  )
}
