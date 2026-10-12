import { addressHandlers } from './address'
import { adminDispatchHandlers } from './admin-dispatch'
import { adminProductHandlers } from './admin-product'
import { adminReservationHandlers } from './admin-reservation'
import { adminStockHandlers } from './admin-stock'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { forceErrorHandler } from './forceError'
import { notificationHandlers } from './notification'
import { orderHandlers } from './order'
import { preorderHandlers } from './preorder'
import { productHandlers } from './product'
import { reviewHandlers } from './review'
import { waitingroomHandlers } from './waitingroom'

import type { RequestHandler } from 'msw'

export const handlers: RequestHandler[] = [
  // 맨 앞에 둬야 ?mock=500일 때 다른 핸들러보다 먼저 응답한다.
  forceErrorHandler,
  ...adminReservationHandlers,
  ...adminDispatchHandlers,
  ...adminStockHandlers,
  ...adminProductHandlers,
  ...productHandlers,
  ...reviewHandlers,
  // 대기열(/preorders/queue)이 예약 상세(/preorders/:preorderId)보다 먼저 잡혀야 한다.
  ...waitingroomHandlers,
  ...preorderHandlers,
  ...orderHandlers,
  ...cartHandlers,
  ...notificationHandlers,
  ...authHandlers,
  ...addressHandlers,
]
