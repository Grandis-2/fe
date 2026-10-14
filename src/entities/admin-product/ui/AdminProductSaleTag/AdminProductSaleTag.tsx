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
   * 사전예약 접수 단계. 있으면 이것만 보인다 — 판매 중(ACTIVE)은 '판매 중지를 걸지
   * 않았다'는 뜻일 뿐이라 '오픈 전'과 같이 서면 오픈한 것처럼 읽힌다. 판매 중지는
   * 회차 취소라 접수 단계와 같이 보인다.
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
  // 사전예약이 판매 중이면 접수 단계가 상태를 다 말해 준다.
  const showSaleState = !stage || status === 'PAUSED'

  return (
    <>
      {showSaleState && (
        <Tag
          size="medium"
          rounded={false}
          widthOptions={saleStateLabels}
          color={saleStateColor[status]}
        >
          {saleStateLabel[status]}
        </Tag>
      )}
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
