import type { ProductSort } from '@entities/product'
import type { DropdownOption } from '@shared/ui'

export const SORT_OPTIONS: DropdownOption<ProductSort>[] = [
  { label: '최신순', value: 'NEWEST' },
  { label: '낮은 가격순', value: 'PRICE_ASC' },
  { label: '높은 가격순', value: 'PRICE_DESC' },
]

// ponytail: 목록 응답에 용량 정보가 없어 자주 쓰는 값을 고정으로 둔다 — 필터 값 API가 생기면 응답으로 바꾼다.
// 서버는 공백·대소문자를 무시하고 비교한다.
export const STORAGE_OPTIONS = ['128GB', '256GB', '512GB', '1TB']
