import type { ProductCardData } from './ProductCard'
import type { ProductListItem } from '../../model/product'

// 목록 응답(ProductListItem)을 카드가 그리는 모양(ProductCardData)으로 바꾼다 —
// 선택된 색상 인덱스를 받아 선택 표시까지 채운다.
// 색상·모델명은 백엔드에 추가될 칸이라, 오기 전엔 대표 사진 한 장으로 그리고 색상칩·모델명은 비운다.
export function toProductCardData(
  product: ProductListItem,
  colorIndex: number,
): ProductCardData {
  const colors = product.colors ?? []
  const color = colors[colorIndex]
  return {
    productId: product.productId,
    imageSrcs: color?.imageUrls ?? (product.imageUrl ? [product.imageUrl] : []),
    name: product.title,
    modelNumber: product.modelNumber ?? '',
    colorName: color?.label ?? '',
    saleMode: product.saleMode,
    colorSwatches: colors.map((item, i) => ({
      ...item,
      selected: i === colorIndex,
    })),
    // ponytail: 판매 중 옵션이 없으면 최저가가 null로 와서 0으로 그린다 — 판매 중지 표시가 필요해지면 카드에 상태를 추가.
    basePrice: product.minPrice ?? 0,
  }
}
