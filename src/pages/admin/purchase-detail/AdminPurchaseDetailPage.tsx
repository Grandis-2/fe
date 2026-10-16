import { useParams } from 'react-router'

import { orderNo, useAdminOrder } from '@entities/admin-order'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_PURCHASES_PATH } from '@shared/config/routes'
import {
  Breadcrumb,
  InlineAlert,
  PageSkeleton,
  RefreshStatus,
} from '@shared/ui'
import { AdminOrderDetail } from '@widgets/admin/order-detail'

import * as styles from './AdminPurchaseDetailPage.css'

/** 주소에서 주문을 읽어 상세 위젯에 넘긴다. 조회 실패·로딩·갱신 시각은 여기서 보여준다 */
export function AdminPurchaseDetailPage() {
  const { orderId = '' } = useParams()
  const order = useAdminOrder(orderId)

  if (!order.data) {
    // 불러오는 중이면 화면 모양을 먼저 깐다 — 실패일 때만 안내와 돌아갈 길을 보인다.
    if (!order.isError) {
      return (
        <div className={styles.root}>
          <PageSkeleton sections={3} fieldsPerSection={2} />
        </div>
      )
    }
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          {getErrorMessage(order.error, '주문을 불러오지 못했습니다.')}
          <Breadcrumb
            items={[
              { label: '주문 관리로 돌아가기', to: ADMIN_PURCHASES_PATH },
            ]}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <Breadcrumb
        items={[
          { label: '주문 관리', to: ADMIN_PURCHASES_PATH },
          { label: `주문 ${orderNo(order.data.orderId)}` },
        ]}
      />

      <RefreshStatus
        updatedAt={order.dataUpdatedAt}
        onRefresh={() => void order.refetch()}
      />

      {/* 갱신이 실패해도 이전 값은 남아 화면에 보인다 — 멈춘 값을 최신으로 읽지 않게 알린다. */}
      {order.isError && (
        <InlineAlert status="warning">
          {getErrorMessage(order.error, '주문을 다시 불러오지 못했습니다.')}{' '}
          아래 내용은 마지막으로 받은 값입니다.
        </InlineAlert>
      )}

      <AdminOrderDetail order={order.data} />
    </div>
  )
}
