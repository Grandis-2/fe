import { http } from 'msw'

import { adminProductStore } from '../fixtures/admin-product'
import { adminStockStore, findStockItem } from '../fixtures/admin-stock'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  AdminStockItem,
  AdminStockPutRequest,
  StockOverviewResponse,
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

const hasVariant = (productId: string, optionCode: string) =>
  adminProductStore
    .find((product) => product.productId === productId)
    ?.variants.some((variant) => variant.optionCode === optionCode) ?? false

export const adminStockHandlers: RequestHandler[] = [
  http.get(url('/api/v1/admin/products/:productId/stock'), ({ params }) => {
    const productId = String(params.productId)
    const product = adminProductStore.find(
      (item) => item.productId === productId,
    )
    if (!product) return notFound()

    // 사전예약은 재고를 세지 않는다 — 오류 대신 tracked false와 빈 목록을 준다.
    if (product.saleMode === 'PREORDER') {
      return ok<StockOverviewResponse>({ productId, tracked: false, items: [] })
    }

    // 저장소(예전 모양)를 명세 모양으로 바꿔 내보낸다. 옵션 id는 상세 목업과 같은
    // 옵션 코드를 쓴다.
    return ok<StockOverviewResponse>({
      productId,
      tracked: true,
      items: adminStockStore
        .filter((item) => item.productId === productId)
        .map((item) => ({
          optionId: item.optionCode,
          registered: true,
          stockTotal: item.initialQuantity,
          stockReserved: item.reservedQuantity,
          stockSold: 0,
          available: item.availableQuantity,
        })),
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

      // PUT은 업서트다. 상품을 수정하면 variant 코드가 새로 생기는데, 그때
      // 재고 행이 아직 없다고 거절하면 새 옵션에는 수량을 넣을 방법이 없다.
      // 상품에 없는 옵션 코드일 때만 거절한다.
      let item = findStockItem(productId, body.optionCode)
      if (!item) {
        if (!hasVariant(productId, body.optionCode)) return notFound()

        item = {
          productId,
          optionCode: body.optionCode,
          policy: 'LIMITED',
          initialQuantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          adjustmentsEnabled: true,
          updatedAt: new Date().toISOString(),
          updatedBy: null,
        }
        adminStockStore.push(item)
      }

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
