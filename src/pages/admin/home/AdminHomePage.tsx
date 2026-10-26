import { useAdminProducts } from '@entities/admin-product'
import { AdminOpsHome } from '@widgets/admin/ops-home'

/**
 * 운영 대시보드(관리자 첫 화면). 대기열 응답엔 상품 id만 있어 사전예약 상품 이름을 붙여
 * 넘긴다. 제목은 갱신 시각과 한 줄에 두려고 위젯이 그린다.
 */
export function AdminHomePage() {
  const { data: products = [] } = useAdminProducts({ saleMode: 'PREORDER' })
  const productNames = new Map(
    products.map((product) => [product.productId, product.name]),
  )

  return <AdminOpsHome productNames={productNames} />
}
