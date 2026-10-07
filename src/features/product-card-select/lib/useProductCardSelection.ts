import { useState } from 'react'

import {
  toProductCardData,
  type ProductCardProps,
  type ProductListItem,
} from '@entities/product'

// 카드 목록마다 반복되던 색상 선택 상태를 한곳에 모은다.
// productId로 맵을 들고 있어서 상품 개수가 서버 응답에 따라 달라져도 된다.
export function useProductCardSelection() {
  const [colorSelections, setColorSelections] = useState<
    Record<string, number>
  >({})

  // <ProductCard {...getCardProps(product)} />로 바로 펼쳐 쓴다.
  const getCardProps = (
    product: ProductListItem,
  ): Pick<ProductCardProps, 'product' | 'onColorSelect'> => {
    const { productId } = product
    return {
      product: toProductCardData(product, colorSelections[productId] ?? 0),
      onColorSelect: (index) =>
        setColorSelections((prev) => ({ ...prev, [productId]: index })),
    }
  }

  return { getCardProps }
}
