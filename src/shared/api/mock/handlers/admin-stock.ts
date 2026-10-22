import { http } from 'msw'

import { adminProductStore } from '../fixtures/admin-product'
import { adminStockStore, findStockItem } from '../fixtures/admin-stock'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  AdminStockItem,
  StockCorrectionRequest,
  StockCorrectionResponse,
  StockOverviewResponse,
  StockReconcileDriftOption,
  StockReconcileRunResponse,
  StockRequest,
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

/**
 * 오늘 새벽 대조에서 어긋난 옵션. 목은 첫 일반 상품의 셋째 옵션 하나를 장부가 주문보다
 * 2개 많게 잡은 것으로 둔다 — 보정하면 장부를 주문 기준으로 내리고 correctedAt을 단다.
 */
let driftOptions: StockReconcileDriftOption[] | null = null
const seedDrifts = (): StockReconcileDriftOption[] => {
  const product = adminProductStore.find((item) => item.saleMode !== 'PREORDER')
  const variant = product?.variants[2]
  const stock =
    product && variant && findStockItem(product.productId, variant.optionCode)
  if (!product || !variant || !stock) return []
  return [
    {
      optionId: variant.optionCode,
      productId: product.productId,
      registered: true,
      stockTotal: stock.initialQuantity,
      expectedReserved: Math.max(0, stock.reservedQuantity - 2),
      stockReserved: stock.reservedQuantity,
      expectedSold: 0,
      stockSold: 0,
      correctedAt: null,
    },
  ]
}
const drifts = () => (driftOptions ??= seedDrifts())

const reconcileRunAt = () => {
  const today = new Date()
  today.setHours(4, 0, 0, 0)
  return today
}

export const adminStockHandlers: RequestHandler[] = [
  http.get(url('/api/v1/admin/stock/reconcile-runs/latest'), () => {
    const startedAt = reconcileRunAt()
    const options = drifts()
    return ok<StockReconcileRunResponse>({
      startedAt: startedAt.toISOString(),
      finishedAt: new Date(startedAt.getTime() + 4 * 60_000).toISOString(),
      driftOptions: options.length,
      truncated: false,
      options,
    })
  }),

  http.post(
    url('/api/v1/admin/products/:productId/stock/options/:optionId/reconcile'),
    async ({ request, params }) => {
      const productId = String(params.productId)
      const optionId = String(params.optionId)
      if (!productExists(productId)) return notFound()
      const body = (await request
        .json()
        .catch(() => null)) as Partial<StockCorrectionRequest> | null
      const reason = body?.reason?.trim() ?? ''
      if (!reason || reason.length > 500) {
        return fail(400, {
          code: 'VALIDATION_FAILED',
          message: '입력값을 확인해 주세요.',
          violations: [{ field: 'reason', message: '1~500자여야 합니다.' }],
        })
      }

      const stock = findStockItem(productId, optionId)
      const drift = drifts().find((item) => item.optionId === optionId)
      const before = {
        stockReserved: stock?.reservedQuantity ?? 0,
        stockSold: 0,
      }
      if (!stock || !drift || drift.correctedAt) {
        return ok<StockCorrectionResponse>({
          optionId,
          registered: !!stock,
          stockTotal: stock?.initialQuantity ?? 0,
          before,
          after: before,
          changed: false,
        })
      }

      stock.reservedQuantity = drift.expectedReserved
      stock.availableQuantity = stock.initialQuantity - stock.reservedQuantity
      drift.correctedAt = new Date().toISOString()
      return ok<StockCorrectionResponse>({
        optionId,
        registered: true,
        stockTotal: stock.initialQuantity,
        before,
        after: { stockReserved: stock.reservedQuantity, stockSold: 0 },
        changed: true,
      })
    },
  ),

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
    // 옵션 코드를 쓴다. 재고를 아직 넣지 않은 옵션도 registered false와 0으로 나온다.
    return ok<StockOverviewResponse>({
      productId,
      tracked: true,
      items: product.variants.map((variant) => {
        const item = findStockItem(productId, variant.optionCode)
        return {
          optionId: variant.optionCode,
          registered: !!item,
          stockTotal: item?.initialQuantity ?? 0,
          stockReserved: item?.reservedQuantity ?? 0,
          stockSold: 0,
          available: item?.availableQuantity ?? 0,
        }
      }),
    })
  }),

  http.put(
    url('/api/v1/admin/products/:productId/stock'),
    async ({ request, params }) => {
      const productId = String(params.productId)
      if (!productExists(productId)) return notFound()

      const body = (await request
        .json()
        .catch(() => null)) as Partial<StockRequest> | null
      const items = body?.items ?? []
      if (items.length < 1 || items.length > 500) {
        return fail(400, {
          code: 'VALIDATION_FAILED',
          message: '입력값을 확인해 주세요.',
          violations: [{ field: 'items', message: '1~500개여야 합니다.' }],
        })
      }

      const violations = items.flatMap((item, index) => [
        ...(hasVariant(productId, item.optionId)
          ? []
          : [
              {
                field: `items[${index}].optionId`,
                message: '상품의 옵션이 아닙니다.',
              },
            ]),
        ...(Number.isInteger(item.stockTotal) && item.stockTotal >= 0
          ? []
          : [
              {
                field: `items[${index}].stockTotal`,
                message: '0 이상 정수여야 합니다.',
              },
            ]),
      ])
      if (new Set(items.map((item) => item.optionId)).size !== items.length) {
        violations.push({
          field: 'items',
          message: '같은 옵션이 두 번 왔습니다.',
        })
      }
      if (violations.length > 0) {
        return fail(400, {
          code: 'VALIDATION_FAILED',
          message: '입력값을 확인해 주세요.',
          violations,
        })
      }

      // 전부 반영되거나 전부 안 된다 — 확보된 수량보다 적게 줄이는 옵션이 하나라도
      // 있으면 아무것도 바꾸지 않는다.
      const below = items.filter(
        (item) =>
          item.stockTotal <
          (findStockItem(productId, item.optionId)?.reservedQuantity ?? 0),
      )
      if (below.length > 0) {
        return fail(409, {
          code: 'STOCK_BELOW_COMMITTED',
          message: '이미 확보·판매된 수량보다 적게 줄일 수 없습니다.',
        })
      }

      const saved = items.map(({ optionId, stockTotal }) => {
        const current = findStockItem(productId, optionId)
        const next: AdminStockItem = {
          productId,
          optionCode: optionId,
          policy: 'LIMITED',
          initialQuantity: stockTotal,
          reservedQuantity: current?.reservedQuantity ?? 0,
          availableQuantity: stockTotal - (current?.reservedQuantity ?? 0),
          adjustmentsEnabled: true,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin',
        }
        if (current) adminStockStore[adminStockStore.indexOf(current)] = next
        else adminStockStore.push(next)
        return next
      })

      return ok({
        productId,
        items: saved.map((item) => ({
          optionId: item.optionCode,
          stockTotal: item.initialQuantity,
          stockReserved: item.reservedQuantity,
          stockSold: 0,
          available: item.availableQuantity,
          created: false,
        })),
      })
    },
  ),
]
