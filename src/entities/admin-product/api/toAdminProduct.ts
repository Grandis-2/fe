import type { AdminProductListItem } from '@shared/api/types'

import type { AdminProduct } from '../model/types'

/**
 * 전시 상태를 한 값으로 모은다 — 서버는 두 불리언으로 알려 준다.
 *
 * 준비가 안 끝났으면(registrationCompleted false) 공개로 골라 뒀어도 회원에게
 * 보이지 않으므로 그 상태가 먼저다.
 */
const toDisplayStatus = (item: AdminProductListItem) =>
  !item.registrationCompleted ? 'DRAFT' : item.visible ? 'PUBLISHED' : 'HIDDEN'

/**
 * 관리자 목록 한 줄을 화면이 쓰는 모양으로 바꾼다.
 *
 * 판매 상태(status)와 사전예약 접수 단계(preorderStatus)는 서버가 나눠 주는 대로
 * 둘 다 들고 있는다 — 다른 축이라 하나로 합치면 '판매 중지인데 접수 중'처럼 서로
 * 어긋난 경우를 화면에서 못 보여준다.
 */
export const toAdminProduct = (item: AdminProductListItem): AdminProduct => ({
  productId: item.productId,
  name: item.title,
  saleMode: item.saleMode,
  optionCount: item.optionCount,
  opensAt: item.opensAt,
  closesAt: item.closesAt,
  status: item.status,
  preorderStatus: item.preorderStatus,
  displayStatus: toDisplayStatus(item),
  minPrice: item.minPrice,
  thumbnailUrl: item.imageUrl,
})
