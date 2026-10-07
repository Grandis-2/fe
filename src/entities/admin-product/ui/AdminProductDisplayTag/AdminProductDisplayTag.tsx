import { Tag } from '@shared/ui'

import {
  displayStatusColor,
  displayStatusLabel,
  displayStatusLabels,
  displayStatusVariant,
  type AdminDisplayStatus,
} from '../../model/types'

export type AdminProductDisplayTagProps = {
  status: AdminDisplayStatus
}

/**
 * 전시 상태 뱃지. 목록 셀과 상세 헤더가 같은 모양으로 서야 해서 한곳에 둔다 —
 * 색·변형·너비 규칙이 네 줄짜리라, 양쪽에 따로 적으면 한쪽만 고쳐져 갈라진다.
 */
export function AdminProductDisplayTag({
  status,
}: AdminProductDisplayTagProps) {
  return (
    <Tag
      variant={displayStatusVariant[status]}
      size="medium"
      rounded={false}
      widthOptions={displayStatusLabels}
      color={displayStatusColor[status]}
    >
      {displayStatusLabel[status]}
    </Tag>
  )
}
