import { http } from 'msw'

import { adminProductStore } from '../fixtures/admin-product'
import { adminStockStore, findStockItem } from '../fixtures/admin-stock'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  AdminStockItem,
  AdminStockPutRequest,
  AdminStockResponse,
} from '../../types'
import type { RequestHandler } from 'msw'

const notFound = () =>
  fail(404, {
    code: 'PRODUCT_NOT_FOUND',
    message: '대상을 찾을 수 없습니다.',
    retryable: false,
  })

const productExists = (productId: string) =>
  adminProductStore.some((product) => product.productId === productId)

export const adminStockHandlers: RequestHandler[] = [
  http.get(url('/api/v1/admin/products/:productId/stock'), ({ params }) => {
    const productId = String(params.productId)
    if (!productExists(productId)) return notFound()

    return ok<AdminStockResponse>({
      productId,
      items: adminStockStore.filter((item) => item.productId === productId),
    })
  }),

  http.put(
    url('/api/v1/admin/products/:productId/stock'),
    async ({ request, params }) => {
      const productId = String(params.productId)
      if (!productExists(productId)) return notFound()

      const body = (await request.json()) as AdminStockPutRequest

      const violations = [
        !body.optionCode
          ? { field: 'optionCode', message: '필수 항목입니다.' }
          : null,
        !Number.isInteger(body.initialQuantity) || body.initialQuantity < 0
          ? { field: 'initialQuantity', message: '0 이상이어야 합니다.' }
          : null,
      ].filter((violation) => violation !== null)

      if (violations.length > 0) {
        return fail(400, {
          code: 'VALIDATION_FAILED',
          message: '입력값을 확인해 주세요.',
          retryable: false,
          violations,
        })
      }

      const item = findStockItem(productId, body.optionCode)
      if (!item) return notFound()

      // 조정이 잠겼거나, 이미 확보된 수량보다 적게 줄이려 하면 거절한다.
      if (
        !item.adjustmentsEnabled ||
        body.initialQuantity < item.reservedQuantity
      ) {
        return fail(409, {
          code: 'STOCK_ADJUSTMENT_CONFLICT',
          message: '현재 확보 수량 또는 조정 설정과 충돌합니다.',
          retryable: false,
        })
      }

      const updated: AdminStockItem = {
        ...item,
        policy: body.policy ?? item.policy,
        initialQuantity: body.initialQuantity,
        // 확보된 수량은 그대로 두고 남는 수량만 다시 계산한다.
        availableQuantity: body.initialQuantity - item.reservedQuantity,
        adjustmentsEnabled: body.adjustmentsEnabled ?? item.adjustmentsEnabled,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
      }
      adminStockStore[adminStockStore.indexOf(item)] = updated

      return ok(updated)
    },
  ),
]
