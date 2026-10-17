import { useGiftCandidates } from '@entities/admin-product'

export type GiftProduct = { productId: string; name: string }

/** 증정품으로 고를 수 있는 옵션 — 재고 등록을 마친 판매 중 옵션만 */
export type GiftOption = {
  optionId: string
  label: string
  /** 가용 재고 — 당첨 인원이 이보다 많으면 서버가 회차를 만들지 않는다 */
  available: number
}

/**
 * 증정품 후보(서버가 고를 수 있는 상품·옵션만 준다)와 고른 상품의 옵션. 후보 하나에 옵션과
 * 가용 재고가 함께 와서, 상품을 고른 뒤 따로 받을 것이 없다.
 */
export function useGiftOptions(productId: string) {
  const candidates = useGiftCandidates()

  const products: GiftProduct[] | undefined = candidates.data?.map(
    ({ productId: id, title, visible }) => ({
      productId: id,
      name: visible ? title : `${title} (비공개)`,
    }),
  )
  const options: GiftOption[] | undefined = candidates.data
    ?.find((candidate) => candidate.productId === productId)
    ?.options.map(({ optionId, title, available }) => ({
      optionId,
      label: title,
      available,
    }))

  return { products, options, error: candidates.error }
}
