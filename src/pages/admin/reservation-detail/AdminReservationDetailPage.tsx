import { useLocation, useParams } from 'react-router'

import { useAdminReservation } from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_RESERVATIONS_PATH, readBackTo } from '@shared/config/routes'
import { Breadcrumb, InlineAlert, RefreshStatus } from '@shared/ui'
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
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          {reservation.isError
            ? getErrorMessage(reservation.error, '예약을 불러오지 못했습니다.')
            : '불러오는 중입니다.'}
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

  return (
    <div className={styles.root}>
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
          polling ? '10초마다 자동 갱신' : '취소된 예약이라 자동 갱신하지 않음'
        }
      />

      {/* 갱신이 실패해도 이전 값은 남아 화면에 보인다 — 멈춘 값을 최신으로 읽지 않게 알린다. */}
      {reservation.isError && (
        <InlineAlert status="warning">
          {getErrorMessage(
            reservation.error,
            '예약을 다시 불러오지 못했습니다.',
          )}{' '}
          아래 내용은 마지막으로 받은 값입니다.
        </InlineAlert>
      )}

      <AdminReservationDetail reservation={reservation.data} />
    </div>
  )
}
