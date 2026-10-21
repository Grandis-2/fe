import type { BannerTargetType } from '@entities/admin-banner'
import { useAdminProducts } from '@entities/admin-product'
import { useAdminPromotions } from '@entities/admin-promotion'
import { PAGE_SIZE_MAX } from '@shared/api/fetchAllPages'

export type BannerTargetOption = { id: string; name: string }

/**
 * 배너에 연결할 수 있는 대상 — 일반 판매 상품과 홍보. 사전예약 상품은 서버가 400으로
 * 거절해서 처음부터 빼고 받는다. ponytail: 상품은 첫 100개까지만 — 넘으면 검색어(q)로 받는다.
 */
export function useBannerTargets() {
  const products = useAdminProducts({
    saleMode: 'IN_STOCK',
    size: PAGE_SIZE_MAX,
  })
  const promotions = useAdminPromotions()

  const options: Record<BannerTargetType, BannerTargetOption[] | undefined> = {
    PRODUCT: products.data?.map(({ productId, name }) => ({
      id: productId,
      name,
    })),
    PROMOTION: promotions.data?.map(({ promotionId, name }) => ({
      id: promotionId,
      name,
    })),
  }

  return {
    options,
    isPending: { PRODUCT: products.isPending, PROMOTION: promotions.isPending },
    isError: { PRODUCT: products.isError, PROMOTION: promotions.isError },
  }
}
