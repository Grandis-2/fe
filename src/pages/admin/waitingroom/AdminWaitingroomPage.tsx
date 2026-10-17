import { useAdminProducts } from '@entities/admin-product'
import { AdminWaitingroom } from '@widgets/admin/waitingroom'

import * as styles from './AdminWaitingroomPage.css'

/** 대기열 관리. 대기열 응답엔 상품 id만 있어 사전예약 상품 이름을 붙여 넘긴다 */
export function AdminWaitingroomPage() {
  const { data: products = [] } = useAdminProducts({
    saleMode: 'PREORDER',
    size: 100,
  })
  const productNames = new Map(
    products.map((product) => [product.productId, product.name]),
  )

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>대기열 관리</h1>
      </div>
      <AdminWaitingroom productNames={productNames} />
    </div>
  )
}
