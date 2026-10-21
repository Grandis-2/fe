import type { MouseEvent } from 'react'

import type { ProductListItem } from '@entities/product'
import { productPath } from '@shared/config/routes'

import { joinPreorderQueue } from '../model/preorderQueueStore'

// 목록에서 예약 중인 사전예약 상품을 누르면 상세로 바로 가지 않고 대기열을 거친다 — 차례가 오면 상세로 간다.
// 상세는 입장권이 없으면 줄을 세우지 않으므로(usePreorderSubmit) 목록에서 들어갈 때 여기서 선다.
// 오픈 전·마감·일반 상품은 막지 않아 링크대로 상세로 간다.
// 대기열은 회원 전용인데 features끼리는 import하지 않아, 로그인 확인(useRequireLogin)은 부르는 쪽이 넘긴다.
export const enterPreorderOnClick =
  (requireLogin: (action: () => void) => void) =>
  ({
    productId,
    title,
    preorderStatus,
  }: Pick<ProductListItem, 'productId' | 'title' | 'preorderStatus'>) =>
  (event: MouseEvent) => {
    // 새 탭·새 창으로 여는 클릭(Ctrl/⌘·Shift·가운데 버튼)은 링크 기본 동작대로 둔다.
    const opensElsewhere =
      event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0
    if (preorderStatus !== 'OPEN' || opensElsewhere) return
    event.preventDefault()
    requireLogin(() =>
      joinPreorderQueue({
        productId,
        productName: title,
        to: productPath(productId),
      }),
    )
  }
