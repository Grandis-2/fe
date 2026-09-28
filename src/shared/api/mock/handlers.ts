import { addressHandlers } from './handlers/address'
import { adminProductHandlers } from './handlers/admin-product'
import { adminStockHandlers } from './handlers/admin-stock'
import { authHandlers } from './handlers/auth'
import { cartHandlers } from './handlers/cart'
import { productHandlers } from './handlers/product'

import type { RequestHandler } from 'msw'

export const handlers: RequestHandler[] = [
  // 구매자용 '/products'가 `*/products`로 컴파일돼 '/api/v1/admin/products'까지
  // 가로챈다. MSW는 먼저 일치하는 핸들러를 쓰므로 더 구체적인 admin을 앞에 둔다.
  ...adminStockHandlers,
  ...adminProductHandlers,
  ...productHandlers,
  ...cartHandlers,
  ...authHandlers,
  ...addressHandlers,
]
