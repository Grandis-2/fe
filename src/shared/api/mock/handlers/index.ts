import { addressHandlers } from './address'
import { adminDispatchHandlers } from './admin-dispatch'
import { adminProductHandlers } from './admin-product'
import { adminPromotionHandlers } from './admin-promotion'
import { adminReservationHandlers } from './admin-reservation'
import { adminStockHandlers } from './admin-stock'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { drawHandlers } from './draw'
import { forceErrorHandler } from './forceError'
import { notificationHandlers } from './notification'
import { orderHandlers } from './order'
import { preorderHandlers } from './preorder'
import { productHandlers } from './product'
import { reviewHandlers } from './review'
import { waitingroomHandlers } from './waitingroom'

import type { RequestHandler } from 'msw'

/**
 * 백엔드에 아직 없는 API. 실서버에 붙을 때도 dev에서는 이것만 목으로 받는다 — 없으면
 * 화면을 끝까지 눌러 볼 수 없다. 백엔드가 만들면 여기서 뺀다.
 */
export const pendingBackendHandlers: RequestHandler[] = [
  ...adminPromotionHandlers,
]

export const handlers: RequestHandler[] = [
  // 맨 앞에 둬야 ?mock=500일 때 다른 핸들러보다 먼저 응답한다.
  forceErrorHandler,
  ...adminReservationHandlers,
  ...adminDispatchHandlers,
  ...adminStockHandlers,
  ...adminProductHandlers,
  ...pendingBackendHandlers,
  ...productHandlers,
  ...reviewHandlers,
  // 대기열(/preorders/queue)이 예약 상세(/preorders/:preorderId)보다 먼저 잡혀야 한다.
  ...waitingroomHandlers,
  ...preorderHandlers,
  ...orderHandlers,
  ...drawHandlers,
  ...cartHandlers,
  ...notificationHandlers,
  ...authHandlers,
  ...addressHandlers,
]
