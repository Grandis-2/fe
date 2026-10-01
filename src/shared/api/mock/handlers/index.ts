import { addressHandlers } from './address'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { paymentHandlers } from './payment'
import { productHandlers } from './product'

import type { RequestHandler } from 'msw'

export const handlers: RequestHandler[] = [
  ...productHandlers,
  ...cartHandlers,
  ...authHandlers,
  ...addressHandlers,
  ...paymentHandlers,
]
