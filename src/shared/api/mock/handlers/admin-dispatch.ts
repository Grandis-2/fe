import { http } from 'msw'

import { dispatchWindowStore, versionsOf } from '../fixtures/admin-dispatch'
import { adminProductStore } from '../fixtures/admin-product'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  DispatchWindowCreateRequest,
  DispatchWindowListResponse,
  DispatchWindowVersion,
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

/** 구간이 비었거나 앞 차수와 겹치는지 본다. 문제가 있으면 detail 문구를 돌려준다 */
function findWaveProblem(body: DispatchWindowCreateRequest) {
  if (!body.waves || body.waves.length < 1) {
    return 'waves는 1개 이상이어야 합니다'
  }

  const sorted = [...body.waves].sort((a, b) => a.wave - b.wave)
  for (const [index, wave] of sorted.entries()) {
    if (wave.fromSeq > wave.toSeq) {
      return `wave ${wave.wave} fromSeq(${wave.fromSeq}) > toSeq(${wave.toSeq})`
    }
    const previous = sorted[index - 1]
    if (previous && wave.fromSeq <= previous.toSeq) {
      return `wave ${wave.wave} fromSeq(${wave.fromSeq}) <= wave ${previous.wave} toSeq(${previous.toSeq})`
    }
  }

  const last = sorted[sorted.length - 1]
  if (body.undeterminedFromSeq < 2) {
    return 'undeterminedFromSeq는 2 이상이어야 합니다'
  }
  if (body.undeterminedFromSeq <= last.toSeq) {
    return `undeterminedFromSeq(${body.undeterminedFromSeq}) <= 마지막 wave toSeq(${last.toSeq})`
  }
  return null
}

export const adminDispatchHandlers: RequestHandler[] = [
  http.get(
    url('/api/v1/admin/products/:productId/dispatch-windows'),
    ({ params }) => {
      const productId = String(params.productId)
      if (!findProduct(productId)) return notFound()

      return ok<DispatchWindowListResponse>({ items: versionsOf(productId) })
    },
  ),

  http.post(
    url('/api/v1/admin/products/:productId/dispatch-windows'),
    async ({ request, params }) => {
      const productId = String(params.productId)
      if (!findProduct(productId)) return notFound()

      const body = (await request.json()) as DispatchWindowCreateRequest
      const problem = findWaveProblem(body)
      if (problem) {
        return fail(400, {
          code: 'DISPATCH_WINDOW_INVALID',
          message: '차수 구간이 겹치거나 비어 있습니다.',
          retryable: false,
          violations: [{ field: 'waves', message: problem }],
        })
      }

      const nextVersion =
        Math.max(0, ...versionsOf(productId).map((item) => item.version)) + 1

      const created: DispatchWindowVersion = {
        productId,
        version: nextVersion,
        status: 'DRAFT',
        waves: body.waves,
        undeterminedFromSeq: body.undeterminedFromSeq,
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
        publishedAt: null,
        confirmedCountByWave: null,
      }
      dispatchWindowStore.push(created)

      return ok(created, 201)
    },
  ),

  http.post(
    url('/api/v1/admin/products/:productId/dispatch-windows/:version/publish'),
    ({ params }) => {
      const productId = String(params.productId)
      const product = findProduct(productId)
      if (!product) return notFound()

      // 오픈 후에는 배송 기준과 기존 배정을 바꾸지 않는다.
      if (product.saleStatus === 'OPEN') return alreadyOpen()

      const target = versionsOf(productId).find(
        (item) => item.version === Number(params.version),
      )
      if (!target) return notFound()

      // 활성 버전은 하나뿐이라 나머지 게시본은 내린다.
      for (const item of versionsOf(productId)) {
        if (item.status === 'PUBLISHED') item.status = 'DRAFT'
      }
      target.status = 'PUBLISHED'
      target.publishedAt = new Date().toISOString()
      product.activeDispatchWindowVersion = target.version

      return ok(target)
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
