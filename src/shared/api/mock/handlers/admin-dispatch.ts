import { http } from 'msw'

import {
  dispatchWindowOf,
  dispatchWindowStore,
} from '../fixtures/admin-dispatch'
import { adminProductStore } from '../fixtures/admin-product'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  DispatchWindow,
  DispatchWindowPutRequest,
  ProductOpenAtRequest,
} from '../../types'
import type { RequestHandler } from 'msw'

const notFound = () =>
  fail(404, {
    code: 'PRODUCT_NOT_FOUND',
    message: '대상을 찾을 수 없습니다.',
    retryable: false,
  })

const alreadyOpen = () =>
  fail(409, {
    code: 'PRODUCT_ALREADY_OPEN',
    message: '오픈 이후에는 변경할 수 없습니다.',
    retryable: false,
  })

const findProduct = (productId: string) =>
  adminProductStore.find((product) => product.productId === productId)

/**
 * 구간이 1번부터 빈틈없이 이어지는지 본다. 문제가 있으면 detail 문구를 돌려준다.
 * 화면은 인원 수로만 입력받아 이런 구간을 만들 수 없지만, 서버는 요청을 믿지 않는다.
 */
function findWaveProblem(body: DispatchWindowPutRequest) {
  if (!body.waves || body.waves.length < 1) {
    return 'waves는 1개 이상이어야 합니다'
  }

  let expectedFrom = 1
  for (const [index, wave] of body.waves.entries()) {
    if (wave.wave !== index + 1) {
      return `wave 번호는 1부터 순서대로여야 합니다(${index + 1}번째가 ${wave.wave})`
    }
    if (wave.fromSeq !== expectedFrom) {
      return `wave ${wave.wave} fromSeq(${wave.fromSeq})는 ${expectedFrom}이어야 합니다`
    }
    if (wave.fromSeq > wave.toSeq) {
      return `wave ${wave.wave} fromSeq(${wave.fromSeq}) > toSeq(${wave.toSeq})`
    }
    expectedFrom = wave.toSeq + 1
  }

  if (body.undeterminedFromSeq !== expectedFrom) {
    return `undeterminedFromSeq(${body.undeterminedFromSeq})는 ${expectedFrom}이어야 합니다`
  }
  return null
}

export const adminDispatchHandlers: RequestHandler[] = [
  http.get(
    url('/api/v1/admin/products/:productId/dispatch-window'),
    ({ params }) => {
      const productId = String(params.productId)
      if (!findProduct(productId)) return notFound()

      return ok<DispatchWindow>(dispatchWindowOf(productId))
    },
  ),

  http.put(
    url('/api/v1/admin/products/:productId/dispatch-window'),
    async ({ request, params }) => {
      const productId = String(params.productId)
      const product = findProduct(productId)
      if (!product) return notFound()

      // 오픈 후에는 배송 기준과 기존 배정을 바꾸지 않는다.
      if (product.saleStatus === 'OPEN') return alreadyOpen()

      const body = (await request.json()) as DispatchWindowPutRequest
      const problem = findWaveProblem(body)
      if (problem) {
        return fail(400, {
          code: 'DISPATCH_WINDOW_INVALID',
          message: '차수 구간이 겹치거나 비어 있습니다.',
          retryable: false,
          violations: [{ field: 'waves', message: problem }],
        })
      }

      const saved: DispatchWindow = {
        productId,
        waves: body.waves,
        undeterminedFromSeq: body.undeterminedFromSeq,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
      }
      const index = dispatchWindowStore.findIndex(
        (window) => window.productId === productId,
      )
      if (index === -1) dispatchWindowStore.push(saved)
      else dispatchWindowStore[index] = saved

      return ok(saved)
    },
  ),

  http.put(
    url('/api/v1/admin/products/:productId/open-at'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product) return notFound()
      if (product.saleStatus === 'OPEN') return alreadyOpen()

      const body = (await request.json()) as ProductOpenAtRequest
      if (!body.openAt || Number.isNaN(new Date(body.openAt).getTime())) {
        return fail(400, {
          code: 'VALIDATION_FAILED',
          message: '입력값을 확인해 주세요.',
          retryable: false,
          violations: [{ field: 'openAt', message: '올바른 일시가 아닙니다.' }],
        })
      }

      product.openAt = body.openAt
      product.sale = { ...product.sale, openAt: body.openAt }
      product.updatedAt = new Date().toISOString()

      return ok(product)
    },
  ),
]
