import { useAdminBanners, type BannerTargetType } from '@entities/admin-banner'
import { useAdminProducts } from '@entities/admin-product'
import { useAdminPromotions } from '@entities/admin-promotion'

export type BannerTargetOption = {
  id: string
  name: string
  /** 다른 배너가 이미 연결한 대상 — 고를 수 없게 막는다 */
  taken: boolean
}

/**
 * 배너에 연결할 수 있는 대상 — 일반 판매 상품과 홍보. 사전예약 상품은 서버가 400으로
 * 거절해서 처음부터 빼고 받는다. 끝난 홍보는 걸어 봐야 고객에게 안 보여 뺀다(고치는 배너가
 * 이미 걸고 있으면 남긴다).
 */
export function useBannerTargets(bannerId?: string) {
  const products = useAdminProducts({ saleMode: 'IN_STOCK' })
  const promotions = useAdminPromotions()
  const banners = useAdminBanners()

  const current = banners.data?.find((banner) => banner.bannerId === bannerId)
  const taken = new Set(
    banners.data
      ?.filter((banner) => banner !== current)
      .map(({ target }) => `${target.type}:${target.id}`),
  )
  const option = (type: BannerTargetType, id: string, name: string) => ({
    id,
    name,
    taken: taken.has(`${type}:${id}`),
  })

  const options: Record<BannerTargetType, BannerTargetOption[] | undefined> = {
    PRODUCT: products.data?.map(({ productId, name }) =>
      option('PRODUCT', productId, name),
    ),
    PROMOTION: promotions.data
      ?.filter(
        ({ status, promotionId }) =>
          status !== 'ENDED' || promotionId === current?.target.id,
      )
      .map(({ promotionId, name }) => option('PROMOTION', promotionId, name)),
  }

  // 배너 목록이 와야 어느 대상이 이미 걸렸는지 안다 — 그 전엔 목록을 보이지 않는다.
  return {
    options,
    isPending: {
      PRODUCT: products.isPending || banners.isPending,
      PROMOTION: promotions.isPending || banners.isPending,
    },
    isError: {
      PRODUCT: products.isError || banners.isError,
      PROMOTION: promotions.isError || banners.isError,
    },
  }
}
