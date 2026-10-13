import { Tag } from '@shared/ui'

import {
  preorderStageColor,
  preorderStageLabel,
  preorderStageLabels,
  saleStateColor,
  saleStateLabel,
  saleStateLabels,
  type AdminPreorderStage,
  type AdminSaleState,
} from '../../model/types'

export type AdminProductSaleTagProps = {
  /** 상품 판매 상태. 모든 상품에 있다 */
  status: AdminSaleState
  /**
   * 사전예약 접수 단계. 있으면 판매 상태 뒤에 같이 선다 — 판매 상태와 다른 축이라
   * 하나로 합치면 '판매 중지인데 접수 중'처럼 서로 어긋난 경우를 가린다.
   */
  stage?: AdminPreorderStage | null
}

/**
 * 판매 상태 뱃지. 목록 셀과 상세 헤더가 같은 모양으로 서야 해서 한곳에 둔다 —
 * 색·변형·너비 규칙을 양쪽에 따로 적으면 한쪽만 고쳐져 갈라진다.
 */
export function AdminProductSaleTag({
  status,
  stage,
}: AdminProductSaleTagProps) {
  return (
    <>
      <Tag
        size="medium"
        rounded={false}
        widthOptions={saleStateLabels}
        color={saleStateColor[status]}
      >
        {saleStateLabel[status]}
      </Tag>
      {stage && (
        <Tag
          size="medium"
          variant="outline"
          rounded={false}
          widthOptions={preorderStageLabels}
          color={preorderStageColor[stage]}
        >
          {preorderStageLabel[stage]}
        </Tag>
      )}
    </>
  )
}
