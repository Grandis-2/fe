import { useSearchParams } from 'react-router'

import { useAdminProducts } from '@entities/admin-product'
import { Dropdown } from '@shared/ui'
import type { DropdownOption } from '@shared/ui'
import { AdminReservationReconcile } from '@widgets/admin/reservation-reconcile'

import * as styles from './AdminReconciliationPage.css'

const PRODUCT_PARAM = 'product'

/** 외부 예약 대조. 상품을 고르는 일만 하고, 대조는 위젯이 맡는다 */
export function AdminReconciliationPage() {
  // 상품명은 겹칠 수 있어 이름이 아니라 productId로 고른다. 상세에 갔다 돌아와도
  // 같은 상품이 보이게 주소(?product=)에 둔다.
  const [searchParams, setSearchParams] = useSearchParams()
  const productId = searchParams.get(PRODUCT_PARAM) ?? undefined
  const setProductId = (next: string | undefined) =>
    setSearchParams(
      (prev) => {
        if (next) prev.set(PRODUCT_PARAM, next)
        else prev.delete(PRODUCT_PARAM)
        return prev
      },
      { replace: true },
    )
  const { data: products = [] } = useAdminProducts({
    saleMode: 'PREORDER',
    size: 100,
  })

  // 값이 undefined인 첫 항목이 '전체 상품' — 외부에만 있는 등록까지 다 본다.
  const productOptions: DropdownOption<string | undefined>[] = [
    { label: '전체 상품', value: undefined },
    ...products.map((product) => ({
      label: product.name,
      value: product.productId,
    })),
  ]
  const productNames = new Map(
    products.map((product) => [product.productId, product.name]),
  )

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>외부 예약 대조</h1>
        <Dropdown
          label="현재 선택된 상품"
          size="medium"
          width="200px"
          options={productOptions}
          value={productId}
          onSelect={setProductId}
        />
      </div>
      <AdminReservationReconcile
        productId={productId}
        productNames={productNames}
      />
    </div>
  )
}
