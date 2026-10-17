import { http } from 'msw'

import { adminProductStore } from '../fixtures/admin-product'
import { shipmentBatchStore } from '../fixtures/admin-shipment'
import { fail, invalid, ok } from '../response'
import { url } from '../url'

import type {
  ShipmentBatch,
  ShipmentBatchesRequest,
  ShipmentBatchListResponse,
} from '../../types'
import type { RequestHandler } from 'msw'

const PATH = '/api/v1/admin/preorders/products/:productId/shipment-batches'

// 차수는 회차에 딸려 있다 — 사전예약 상품이 아니면(회차 없음) 404다.
const findPreorder = (productId: string) =>
  adminProductStore.find(
    (product) =>
      product.productId === productId && product.badges.includes('PREORDER'),
  )

const noCampaign = () =>
  fail(404, { code: 'PRODUCT_NOT_FOUND', message: '상품을 찾을 수 없습니다.' })

/** 서버의 차수 규칙을 어긴 이유. 지키면 null */
function batchRuleProblem(batches: ShipmentBatch[]) {
  let expectedFrom = 1
  for (const [index, batch] of batches.entries()) {
    if (batch.batchNumber !== index + 1) {
      return `batchNumber는 1부터 순서대로여야 합니다(${index + 1}번째가 ${batch.batchNumber})`
    }
    if (batch.positionFrom !== expectedFrom) {
      return `batch ${batch.batchNumber} positionFrom(${batch.positionFrom}) != ${expectedFrom}`
    }
    const last = index === batches.length - 1
    if ((batch.positionTo === null) !== last) {
      return '상한 없는 차수(positionTo = null)는 정확히 하나이고 마지막이어야 합니다.'
    }
    if (batch.positionTo !== null) {
      if (batch.positionTo < batch.positionFrom) {
        return `batch ${batch.batchNumber} positionTo < positionFrom`
      }
      expectedFrom = batch.positionTo + 1
    }
    if (batch.estimatedShipEnd < batch.estimatedShipStart) {
      return `batch ${batch.batchNumber} estimatedShipEnd < estimatedShipStart`
    }
  }
  return null
}

export const adminShipmentHandlers: RequestHandler[] = [
  http.get(url(PATH), ({ params }) => {
    const productId = String(params.productId)
    if (!findPreorder(productId)) return noCampaign()
    return ok<ShipmentBatchListResponse>({
      items: shipmentBatchStore.get(productId) ?? [],
    })
  }),

  http.put(url(PATH), async ({ request, params }) => {
    const productId = String(params.productId)
    const product = findPreorder(productId)
    if (!product) return noCampaign()
    // 접수 중(OPEN)도 마감(CLOSED)도 이미 오픈한 뒤다.
    if (product.saleStatus !== 'BEFORE_OPEN') {
      return fail(409, {
        code: 'PRODUCT_ALREADY_OPEN',
        message: '사전예약이 이미 오픈되어 바꿀 수 없습니다.',
      })
    }

    const body = (await request
      .json()
      .catch(() => null)) as Partial<ShipmentBatchesRequest> | null
    const batches = body?.batches
    if (!batches || batches.length === 0) {
      return invalid([{ field: 'batches', message: 'must not be empty' }])
    }
    const missing = batches.findIndex(
      (batch) => !batch.estimatedShipStart || !batch.estimatedShipEnd,
    )
    if (missing !== -1) {
      return invalid([
        {
          field: `batches[${missing}].estimatedShipStart`,
          message: 'must not be null',
        },
      ])
    }
    // 실서버는 사유를 details.reason에 싣는다. 화면은 message만 보여준다.
    if (batchRuleProblem(batches)) {
      return fail(400, {
        code: 'SHIPMENT_BATCH_INVALID',
        message: '배송 차수 구간이 겹치거나 비어 있습니다.',
      })
    }

    shipmentBatchStore.set(productId, batches)
    return ok<ShipmentBatchListResponse>({ items: batches })
  }),
]
