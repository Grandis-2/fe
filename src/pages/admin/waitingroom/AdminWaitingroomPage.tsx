import { useAdminProducts } from '@entities/admin-product'
import { AdminWaitingroom } from '@widgets/admin/waitingroom'

/**
 * 대기열 관리. 대기열 응답엔 상품 id만 있어 사전예약 상품 이름을 붙여 넘긴다. 제목은 갱신
 * 시각과 한 줄에 두려고 위젯이 그린다.
 */
export function AdminWaitingroomPage() {
  const { data: products = [] } = useAdminProducts({ saleMode: 'PREORDER' })
  const productNames = new Map(
    products.map((product) => [product.productId, product.name]),
  )

  return <AdminWaitingroom productNames={productNames} />
}
