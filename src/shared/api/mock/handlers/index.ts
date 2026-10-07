import { addressHandlers } from './address'
import { adminDispatchHandlers } from './admin-dispatch'
import { adminProductHandlers } from './admin-product'
import { adminReservationHandlers } from './admin-reservation'
import { adminStockHandlers } from './admin-stock'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { forceErrorHandler } from './forceError'
import { notificationHandlers } from './notification'
import { paymentHandlers } from './payment'
import { productHandlers } from './product'

import type { RequestHandler } from 'msw'

export const handlers: RequestHandler[] = [
  // 맨 앞에 둬야 ?mock=500일 때 다른 핸들러보다 먼저 응답한다.
  forceErrorHandler,
  ...adminReservationHandlers,
  ...adminDispatchHandlers,
  ...adminStockHandlers,
  ...adminProductHandlers,
  ...productHandlers,
  ...cartHandlers,
  ...notificationHandlers,
  ...authHandlers,
  ...addressHandlers,
  ...paymentHandlers,
]
