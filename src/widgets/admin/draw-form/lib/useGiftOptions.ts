import {
  getAdminProductStocks,
  useAdminProduct,
  useAdminProducts,
  useAdminProductStock,
} from '@entities/admin-product'

// 서버가 한 번에 주는 최대 크기. 일반 상품이 이보다 많아지면 검색이 필요하다.
const PAGE_SIZE = 100

export type GiftProduct = { productId: string; name: string }

/** 증정품으로 고를 수 있는 옵션 — 재고 등록을 마친 판매 중 옵션만 */
export type GiftOption = {
  optionId: string
  label: string
  /** 가용 재고 — 당첨 인원이 이보다 많으면 서버가 회차를 만들지 않는다 */
  available: number
}

/** 증정품 후보 상품 — 일반 판매(IN_STOCK)이고 판매 중인 상품. 비공개 상품도 된다 */
export function useGiftProducts() {
  const list = useAdminProducts({
    saleMode: 'IN_STOCK',
    status: 'ACTIVE',
    size: PAGE_SIZE,
  })
  const products: GiftProduct[] | undefined = list.data?.map(
    ({ productId, name }) => ({ productId, name }),
  )
  return { products, isPending: list.isPending, error: list.error }
}

/**
 * 고른 상품의 옵션과 가용 재고. 옵션 이름은 상품 상세, 수량은 재고 API에 있어 둘을
 * 맞붙인다 — 재고 줄이 없는 옵션(재고 등록 전)은 빠진다.
 */
export function useGiftOptions(productId: string) {
  const product = useAdminProduct(productId)
  const stock = useAdminProductStock(productId)

  const options: GiftOption[] | undefined =
    product.data && stock.data
      ? getAdminProductStocks(product.data, stock.data)
          .filter(
            (row) =>
              product.data.variants.find(
                (variant) => variant.variantId === row.optionId,
              )?.status === 'ACTIVE',
          )
          .map((row) => ({
            optionId: row.optionId,
            label: [row.color, ...row.optionNames]
              .filter((name) => name !== '-')
              .join(' / '),
            available: row.available,
          }))
      : undefined

  return {
    options,
    // 상품을 고르기 전엔 두 조회가 꺼져 있어 pending이다 — 로딩으로 보지 않는다.
    isPending: productId !== '' && (product.isPending || stock.isPending),
    error: product.error ?? stock.error,
  }
}
