import { addressHandlers } from './handlers/address'
import { authHandlers } from './handlers/auth'
import { cartHandlers } from './handlers/cart'
import { paymentHandlers } from './handlers/payment'
import { productHandlers } from './handlers/product'

import type { RequestHandler } from 'msw'

export const handlers: RequestHandler[] = [
  ...productHandlers,
  ...cartHandlers,
  ...authHandlers,
  ...addressHandlers,
  ...paymentHandlers,
]
