import {
  useAdminProductDetails,
  useAdminProducts,
} from '@entities/admin-product'
import type { PromotionLinkableProduct } from '@entities/admin-promotion'

// 서버가 한 번에 주는 최대 크기. 사전예약 상품이 이보다 많아지면 검색이 필요하다.
const PAGE_SIZE = 100

const openAtLabel = (opensAt: string | null) => {
  if (!opensAt) return '회차 미정'
  const date = new Date(opensAt)
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${date.getMonth() + 1}/${date.getDate()} ${time} 오픈`
}

/**
 * 프로모션에 연결할 수 있는 상품 — 등록된 사전예약 상품 전부. 색상·용량은 목록에
 * 없어 상품마다 상세를 받아 채운다(받기 전엔 비어 있다).
 */
export function useLinkableProducts() {
  const list = useAdminProducts({ saleMode: 'PREORDER', size: PAGE_SIZE })
  const details = useAdminProductDetails(
    list.data?.map((product) => product.productId) ?? [],
  )

  const products: PromotionLinkableProduct[] | undefined = list.data?.map(
    (product, index) => {
      const axes = details[index]?.data?.optionAxes ?? []
      const valuesOf = (key: string) =>
        axes.find((axis) => axis.key === key)?.values.map((v) => v.value) ?? []
      return {
        productId: product.productId,
        name: product.name,
        openAtLabel: openAtLabel(product.opensAt),
        colors: valuesOf('color'),
        storages: valuesOf('storage'),
      }
    },
  )

  return { products, isPending: list.isPending, isError: list.isError }
}
