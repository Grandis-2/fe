import { Tag } from '@shared/ui'

import {
  saleStatusColor,
  saleStatusLabel,
  saleStatusLabels,
  type AdminSaleStatus,
} from '../../model/types'

export type AdminProductSaleTagProps = {
  status: AdminSaleStatus
}

/**
 * 판매 상태 뱃지. 전시 뱃지(AdminProductDisplayTag)와 나란히 서는 자리라 모양 규칙을
 * 같이 한곳에 둔다 — 양쪽 페이지에 따로 적으면 색이나 너비가 한쪽만 고쳐진다.
 */
export function AdminProductSaleTag({ status }: AdminProductSaleTagProps) {
  return (
    <Tag
      variant="subtle"
      size="medium"
      rounded={false}
      widthOptions={saleStatusLabels}
      color={saleStatusColor[status]}
    >
      {saleStatusLabel[status]}
    </Tag>
  )
}
