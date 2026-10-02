import { addressHandlers } from './address'
import { adminDispatchHandlers } from './admin-dispatch'
import { adminProductHandlers } from './admin-product'
import { adminReservationHandlers } from './admin-reservation'
import { adminStockHandlers } from './admin-stock'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { paymentHandlers } from './payment'
import { productHandlers } from './product'

import type { RequestHandler } from 'msw'

export const handlers: RequestHandler[] = [
  ...adminReservationHandlers,
  ...adminDispatchHandlers,
  ...adminStockHandlers,
  ...adminProductHandlers,
  ...productHandlers,
  ...cartHandlers,
  ...authHandlers,
  ...addressHandlers,
  ...paymentHandlers,
]
