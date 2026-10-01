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
  // 구매자용 '/products'가 `*/products`로 컴파일돼 '/api/v1/admin/products'까지
  // 가로챈다. MSW는 먼저 일치하는 핸들러를 쓰므로 더 구체적인 admin을 앞에 둔다.
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
