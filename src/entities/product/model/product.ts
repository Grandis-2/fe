import type {
  CategoryNode,
  ProductDetailView,
  ProductListItem as ProductListItemDto,
  SaleMode as SaleModeDto,
  ShipmentBatch as ShipmentBatchDto,
} from '@shared/api/types'

// 응답 모양 그대로 쓴다 — 매퍼가 필요할 만큼 다른 칸이 없다.
export type Product = ProductDetailView
export type ProductListItem = ProductListItemDto
export type SaleMode = SaleModeDto
export type Category = CategoryNode
export type ShipmentBatch = ShipmentBatchDto
