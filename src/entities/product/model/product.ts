import type {
  CategoryNode,
  ProductBrandCode,
  ProductDetailView,
  ProductListItem as ProductListItemDto,
  ProductListParams as ProductListParamsDto,
  ProductSort as ProductSortDto,
  SaleMode as SaleModeDto,
  ShipmentBatch as ShipmentBatchDto,
} from '@shared/api/types'

// 응답 모양 그대로 쓴다 — 매퍼가 필요할 만큼 다른 칸이 없다.
export type Product = ProductDetailView
export type ProductListItem = ProductListItemDto
export type SaleMode = SaleModeDto
export type ProductBrand = ProductBrandCode
export type ProductListParams = ProductListParamsDto
export type ProductSort = ProductSortDto
export type Category = CategoryNode
export type ShipmentBatch = ShipmentBatchDto
