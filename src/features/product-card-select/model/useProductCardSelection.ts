import { useState } from 'react'

import type {
  ProductCardData,
  ProductCardProps,
  ProductCardSummary,
} from '@/entities/product'

function toProductCardData(
  product: ProductCardSummary,
  colorIndex: number,
  optionIndex: number,
): ProductCardData {
  const color = product.colors[colorIndex]
  return {
    productId: product.productId,
    imageSrcs: color?.imageUrls ?? [],
    name: product.name,
    modelNumber: product.modelNumber,
    colorName: color?.label ?? '',
    saleMode: product.saleMode,
    colorSwatches: product.colors.map((item, i) => ({
      ...item,
      selected: i === colorIndex,
    })),
    options: product.options.map((option, i) => ({
      ...option,
      selected: i === optionIndex,
    })),
    basePrice: product.basePrice,
  }
}

// 카드 목록마다 반복되던 색상/용량 선택 상태를 한곳에 모은다.
// productId로 맵을 들고 있어서 상품 개수가 서버 응답에 따라 달라져도 된다.
export function useProductCardSelection() {
  const [colorSelections, setColorSelections] = useState<
    Record<string, number>
  >({})
  const [optionSelections, setOptionSelections] = useState<
    Record<string, number>
  >({})

  // <ProductCard {...getCardProps(product)} />로 바로 펼쳐 쓴다.
  const getCardProps = (
    product: ProductCardSummary,
  ): Pick<ProductCardProps, 'product' | 'onColorSelect' | 'onOptionSelect'> => {
    const { productId } = product
    return {
      product: toProductCardData(
        product,
        colorSelections[productId] ?? 0,
        optionSelections[productId] ?? 0,
      ),
      onColorSelect: (index) =>
        setColorSelections((prev) => ({ ...prev, [productId]: index })),
      onOptionSelect: (index) =>
        setOptionSelections((prev) => ({ ...prev, [productId]: index })),
    }
  }

  return { getCardProps }
}
