import type { ProductCardData } from './ProductCard'
import type { ProductCardSummary } from '../../model/productCard'

// 목록 응답(ProductCardSummary)을 카드가 그리는 모양(ProductCardData)으로 바꾼다 —
// 선택된 색상/용량 인덱스를 받아 선택 표시까지 채운다.
export function toProductCardData(
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
