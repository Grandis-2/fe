import { HttpResponse, http } from 'msw'

import { cartLines, saveOrderDb } from '../fixtures/preorder'
import { products } from '../fixtures/product'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { isUuid, uuidViolation } from '../validate'

import type {
  Cart,
  CartItemResponse,
  CartLine,
  CartUnavailableReason,
  CountResponse,
} from '../../types'
import type { CartLineRecord } from '../fixtures/preorder'
import type { RequestHandler } from 'msw'

// 장바구니 원본(cartLines)은 주문 목업과 같은 DB에 있다 — 결제가 승인되면 주문 핸들러가 산 수량을 뺀다.
// ponytail: 토큰이 있는지만 본다(로그인한 사람은 모두 같은 "나"). 관리자 토큰 403도 흉내 내지 않는다.

const MAX_QUANTITY = 99
const MAX_LINES = 50

// 옵션 id로 상품·옵션을 찾는다.
export function findVariant(variantId: string) {
  for (const product of products) {
    const variant = product.variants.find((it) => it.variantId === variantId)
    if (variant) return { product, variant }
  }
  return null
}

// 지금 살 수 없는 이유 — 위에서부터 하나만.
export function unavailableReason(
  line: Pick<CartLineRecord, 'variantId' | 'warranty' | 'quantity'>,
): CartUnavailableReason | null {
  const found = findVariant(line.variantId)
  if (!found) return 'DISCONTINUED'
  const { product, variant } = found
  if (!product.visible || product.saleMode === 'PREORDER') return 'HIDDEN'
  if (product.status === 'PAUSED' || variant.status === 'PAUSED')
    return 'PAUSED'
  if (line.warranty && !product.warranty.offered) return 'WARRANTY_UNAVAILABLE'
  const available = variant.availableQuantity ?? 0
  if (available === 0) return 'OUT_OF_STOCK'
  if (line.quantity > available) return 'INSUFFICIENT_STOCK'
  return null
}

// 가격은 저장하지 않고 조회할 때마다 상품의 지금 값으로 계산한다.
export function toCartLine(line: CartLineRecord): CartLine {
  const found = findVariant(line.variantId)
  const reason = unavailableReason(line)
  if (!found) {
    return {
      ...line,
      productId: null,
      productTitle: null,
      optionTitle: null,
      imageUrl: null,
      unitPrice: null,
      warrantyPrice: null,
      lineAmount: null,
      availableQuantity: 0,
      purchasable: false,
      unavailableReason: reason,
    }
  }
  const { product, variant } = found
  const warrantyPrice =
    line.warranty && product.warranty.offered ? product.warranty.surcharge : 0
  return {
    ...line,
    productId: product.productId,
    productTitle: product.title,
    optionTitle: variant.title,
    imageUrl: product.imageUrl,
    unitPrice: variant.price,
    warrantyPrice,
    lineAmount: (variant.price + warrantyPrice) * line.quantity,
    availableQuantity: variant.availableQuantity ?? 0,
    purchasable: reason === null,
    unavailableReason: reason,
  }
}

const hasToken = (request: Request) =>
  request.headers.get('Authorization')?.startsWith('Bearer ') === true

const unauthenticated = () =>
  fail(401, { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' })

const lineNotFound = () =>
  fail(404, { code: 'NOT_FOUND', message: '대상을 찾을 수 없습니다.' })

const insufficientStock = () =>
  fail(409, {
    code: 'INSUFFICIENT_STOCK',
    message: '가용 재고보다 많이 담을 수 없습니다.',
  })

// 본문을 읽을 수 없으면(JSON 오류, 정수가 아닌 quantity, UUID가 아닌 variantId) details가 null인 400이다.
const unreadable = () =>
  fail(400, {
    code: 'VALIDATION_FAILED',
    message: '요청 값이 올바르지 않습니다.',
  })

async function readBody(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  return body !== null && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : null
}

const quantityViolation = (message: string) =>
  invalid([{ field: 'quantity', message }])

const toResponse = ({
  cartItemId,
  variantId,
  warranty,
  quantity,
}: CartLineRecord): CartItemResponse => ({
  cartItemId,
  variantId,
  warranty,
  quantity,
})

export const cartHandlers: RequestHandler[] = [
  // 헤더 배지 — 수량 합이 아니라 줄 수(보증 포함·미포함 줄은 따로 센다).
  http.get(url('/api/v1/cart/count'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    return ok<CountResponse>({ count: cartLines.length })
  }),

  http.get(url('/api/v1/cart'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    return ok<Cart>({ items: cartLines.map(toCartLine) })
  }),

  // 담기 — 같은 옵션·보증 여부의 줄이 있으면 수량을 더한다. 성공하면 늘 200.
  http.post(url('/api/v1/cart/items'), async ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const body = await readBody(request)
    if (!body) return unreadable()
    const { variantId, quantity, warranty = false } = body
    if (
      (variantId !== undefined &&
        (typeof variantId !== 'string' || !isUuid(variantId))) ||
      (quantity !== undefined && !Number.isInteger(quantity)) ||
      typeof warranty !== 'boolean'
    )
      return unreadable()
    if (typeof variantId !== 'string')
      return invalid([{ field: 'variantId', message: '필수 항목입니다.' }])
    if (typeof quantity !== 'number' || quantity < 1 || quantity > MAX_QUANTITY)
      return quantityViolation('1~99 사이여야 합니다.')

    const found = findVariant(variantId)
    if (!found || !found.product.visible) return lineNotFound()
    const { product, variant } = found
    if (product.saleMode === 'PREORDER') {
      return fail(409, {
        code: 'PREORDER_NOT_CARTABLE',
        message: '사전예약은 장바구니에 담을 수 없습니다.',
      })
    }
    if (warranty && !product.warranty.offered)
      return invalid([
        { field: 'warranty', message: '보증을 제공하지 않는 상품입니다.' },
      ])
    if (product.status === 'PAUSED' || variant.status === 'PAUSED') {
      return fail(409, {
        code: 'STATE_CONFLICT',
        message:
          '현재 상태에서는 처리할 수 없습니다. 최신 상태를 조회해 주세요.',
      })
    }

    const existing = cartLines.find(
      (line) => line.variantId === variantId && line.warranty === warranty,
    )
    if (!existing && cartLines.length >= MAX_LINES)
      return invalid([
        {
          field: 'variantId',
          message: '장바구니에는 최대 50줄까지 담을 수 있습니다.',
        },
      ])
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    if (nextQuantity > MAX_QUANTITY)
      return quantityViolation('한 줄에 담을 수 있는 수량은 최대 99개입니다.')
    if (nextQuantity > (variant.availableQuantity ?? 0))
      return insufficientStock()

    const line = existing ?? {
      cartItemId: crypto.randomUUID(),
      variantId,
      warranty,
      quantity: 0,
    }
    line.quantity = nextQuantity
    if (!existing) cartLines.push(line)
    saveOrderDb()
    return ok<CartItemResponse>(toResponse(line))
  }),

  // 수량 변경 — 더할 값이 아니라 최종 수량. 판매 상태는 보지 않는다(살 수 있는지는 조회가 알려 준다).
  http.patch(
    url('/api/v1/cart/items/:cartItemId'),
    async ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      const cartItemId = String(params.cartItemId)
      if (!isUuid(cartItemId)) return invalid([uuidViolation('cartItemId')])
      const body = await readBody(request)
      if (!body) return unreadable()
      const { quantity } = body
      if (quantity !== undefined && !Number.isInteger(quantity))
        return unreadable()
      if (
        typeof quantity !== 'number' ||
        quantity < 1 ||
        quantity > MAX_QUANTITY
      )
        return quantityViolation('1~99 사이여야 합니다.')

      const line = cartLines.find((it) => it.cartItemId === cartItemId)
      if (!line) return lineNotFound()
      const available = findVariant(line.variantId)?.variant.availableQuantity
      if (quantity > (available ?? 0)) return insufficientStock()
      line.quantity = quantity
      saveOrderDb()
      return ok<CartItemResponse>(toResponse(line))
    },
  ),

  // 삭제 — 204. 이미 지운 줄이면 404(재요청이면 지워진 것으로 봐도 된다).
  http.delete(url('/api/v1/cart/items/:cartItemId'), ({ params, request }) => {
    if (!hasToken(request)) return unauthenticated()
    const cartItemId = String(params.cartItemId)
    if (!isUuid(cartItemId)) return invalid([uuidViolation('cartItemId')])
    const index = cartLines.findIndex((it) => it.cartItemId === cartItemId)
    if (index < 0) return lineNotFound()
    cartLines.splice(index, 1)
    saveOrderDb()
    return new HttpResponse(null, { status: 204 })
  }),
]
