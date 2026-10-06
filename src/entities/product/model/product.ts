import type {
  ProductDetail,
  ProductSort as ProductSortDto,
  ProductSummary,
} from '@shared/api/types'

export type Product = ProductDetail
export type ProductSort = ProductSortDto
// 목록·검색 결과 한 칸. 배럴의 ProductSummary(컴포넌트)와 이름이 겹치지 않게 따로 부른다.
export type ProductSearchItem = ProductSummary
