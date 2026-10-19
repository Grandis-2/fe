import { useAdminProducts } from '@entities/admin-product'
import { AdminOpsHome } from '@widgets/admin/ops-home'

import * as styles from './AdminHomePage.css'

/** 운영 홈. 대기열 응답엔 상품 id만 있어 사전예약 상품 이름을 붙여 넘긴다 */
export function AdminHomePage() {
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
        <h1 className={styles.title}>운영 홈</h1>
        <div className={styles.description}>
          급한 일부터 위에 보여요. 이상이 없으면 한 줄로 끝나요.
        </div>
      </div>
      <AdminOpsHome productNames={productNames} />
    </div>
  )
}
