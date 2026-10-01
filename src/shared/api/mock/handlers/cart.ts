import { HttpResponse, http } from 'msw'

import { cartItems } from '../fixtures/cart'
import { products } from '../fixtures/product'
import { fail, ok } from '../response'
import { url } from '../url'

import type { ApiViolation, Cart, CartItem } from '../../types'
import type { RequestHandler } from 'msw'

// ponytail: 메모리 상태라 새로고침하면 시드로 돌아간다. 유지가 필요하면 sessionStorage로 옮긴다.
// ponytail: 인증 API가 없어 401/다른 회원 항목 404는 흉내내지 않는다.
let items: CartItem[] = structuredClone(cartItems)

// ponytail: 스펙에 상한이 없어 99로 둔다. 백엔드 확정값이 나오면 맞출 것.
const MAX_QUANTITY = 99

const isValidQuantity = (value: unknown): value is number =>
  Number.isInteger(value) &&
  (value as number) >= 1 &&
  (value as number) <= MAX_QUANTITY

const quantityViolation = {
  field: 'quantity',
  message: `1 이상 ${MAX_QUANTITY} 이하여야 합니다.`,
}

type Body = Record<string, unknown>

async function readBody(request: Request): Promise<Body> {
  const body: unknown = await request.json().catch(() => null)
  return body !== null && typeof body === 'object' ? (body as Body) : {}
}

const findVariant = (productId: string, optionCode: string) =>
  products
    .find((product) => product.productId === productId)
    ?.variants.find((variant) => variant.optionCode === optionCode)

const validationFailed = (message: string, violations: ApiViolation[]) =>
  fail(400, { code: 'VALIDATION_FAILED', message, violations })

const cartItemNotFound = () =>
  fail(404, {
    code: 'CART_ITEM_NOT_FOUND',
    message: '장바구니 항목을 찾을 수 없습니다.',
  })

const optionNotFound = () =>
  fail(404, {
    code: 'PRODUCT_OPTION_NOT_FOUND',
    message: '상품 또는 옵션을 찾을 수 없습니다.',
  })

export const cartHandlers: RequestHandler[] = [
  http.get(url('/cart'), () =>
    ok<Cart>({
      items,
      totalAmount: items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ),
    }),
  ),

  http.post(url('/cart/items'), async ({ request }) => {
    const body = await readBody(request)
    const violations = [
      typeof body.productId !== 'string' || body.productId === ''
        ? { field: 'productId', message: '필수 항목입니다.' }
        : null,
      typeof body.optionCode !== 'string' || body.optionCode === ''
        ? { field: 'optionCode', message: '필수 항목입니다.' }
        : null,
      !isValidQuantity(body.quantity) ? quantityViolation : null,
    ].filter((violation) => violation !== null)

    if (violations.length > 0) {
      return validationFailed('입력값을 확인해 주세요.', violations)
    }

    const productId = body.productId as string
    const optionCode = body.optionCode as string
    const variant = findVariant(productId, optionCode)
    if (!variant) return optionNotFound()

    // 품절·판매 종료여도 담을 수는 있다 — 검증은 구매 시점에 한다(스펙 정책).
    const created: CartItem = {
      cartItemId: crypto.randomUUID(),
      productId,
      optionCode,
      quantity: body.quantity as number,
      unitPrice: variant.price,
    }
    items = [...items, created]
    return ok(created, 201)
  }),

  http.patch(url('/cart/items/:cartItemId'), async ({ request, params }) => {
    const body = await readBody(request)
    const hasOption = body.optionCode !== undefined
    const hasQuantity = body.quantity !== undefined

    if (!hasOption && !hasQuantity) {
      return validationFailed('변경할 옵션 또는 수량을 보내 주세요.', [])
    }
    const violations = [
      hasOption && (typeof body.optionCode !== 'string' || !body.optionCode)
        ? { field: 'optionCode', message: '올바른 옵션 코드를 보내 주세요.' }
        : null,
      hasQuantity && !isValidQuantity(body.quantity) ? quantityViolation : null,
    ].filter((violation) => violation !== null)
    if (violations.length > 0) {
      return validationFailed('입력값을 확인해 주세요.', violations)
    }

    const target = items.find((item) => item.cartItemId === params.cartItemId)
    if (!target) return cartItemNotFound()

    let updated = target
    if (hasOption) {
      const optionCode = body.optionCode as string
      const variant = findVariant(target.productId, optionCode)
      if (!variant) return optionNotFound()
      updated = { ...updated, optionCode, unitPrice: variant.price }
    }
    if (hasQuantity) {
      updated = { ...updated, quantity: body.quantity as number }
    }

    items = items.map((item) =>
      item.cartItemId === updated.cartItemId ? updated : item,
    )
    return ok(updated)
  }),

  http.delete(url('/cart/items/:cartItemId'), ({ params }) => {
    const exists = items.some((item) => item.cartItemId === params.cartItemId)
    if (!exists) return cartItemNotFound()

    items = items.filter((item) => item.cartItemId !== params.cartItemId)
    return new HttpResponse(null, { status: 204 })
  }),
]
