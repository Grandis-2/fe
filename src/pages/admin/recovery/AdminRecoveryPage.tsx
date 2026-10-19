import { useSearchParams } from 'react-router'

import { useAdminProducts } from '@entities/admin-product'
import { AdminRecovery } from '@widgets/admin/recovery'

import * as styles from './AdminRecoveryPage.css'

/**
 * 외부 등록 장애 대응. 볼 사전예약은 주소(?product=)에 둔다 — 운영 대시보드에서 고른
 * 사전예약 그대로 열리고, 다른 화면에 다녀와도 남는다. 없으면 전체.
 */
export function AdminRecoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
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
        <h1 className={styles.title}>장애 대응</h1>
      </div>
      <AdminRecovery
        productNames={productNames}
        selected={searchParams.get('product')}
        onSelect={(productId) =>
          setSearchParams(productId ? { product: productId } : {}, {
            replace: true,
          })
        }
      />
    </div>
  )
}
