import { HttpResponse, http } from 'msw'

import { products } from '../fixtures/product'
import { myOrderItems, reviews as seedReviews } from '../fixtures/review'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { isUuid, readPaging, toPage, uuidViolation } from '../validate'

import { categoryScope, findProduct, idViolations, notFound } from './product'

import type {
  ApiViolation,
  PageResponse,
  ReviewUpdateRequest,
  ReviewView,
} from '../../types'
import type { RequestHandler } from 'msw'

// ponytail: 메모리 상태라 새로고침하면 시드로 돌아간다(장바구니 목업과 같다).
// ponytail: 토큰이 있는지만 본다 — 누가 로그인했든 "나"는 myOrderItems의 주인이다. 관리자 토큰 403도 흉내 내지 않는다.
let reviews: ReviewView[] = structuredClone(seedReviews)

// 작성자 이름은 서버가 실명(없으면 닉네임) 첫 글자만 남기고 가린다.
const MY_AUTHOR_NAME = '김**'
const BODY_MAX = 2000

const myOrderItemIds = new Set(myOrderItems.map((item) => item.orderItemId))
const isMine = (review: ReviewView) =>
  review.orderItemId !== null && myOrderItemIds.has(review.orderItemId)

// 공개 목록엔 orderItemId가 늘 null이다.
const toPublic = (review: ReviewView): ReviewView => ({
  ...review,
  orderItemId: null,
})

// 상품이 비공개로 바뀌면 그 리뷰도 공개 목록에서 빠진다.
const isVisible = (review: ReviewView) =>
  findProduct(review.productId)?.visible === true

const newestFirst = (a: ReviewView, b: ReviewView) =>
  b.createdAt.localeCompare(a.createdAt)

const unauthenticated = () =>
  fail(401, { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' })

const hasToken = (request: Request) =>
  request.headers.get('Authorization')?.startsWith('Bearer ') === true

type Body = Record<string, unknown>

// 본문이 객체가 아니면 'body'로 400이다.
async function readBody(request: Request): Promise<Body | null> {
  const body: unknown = await request.json().catch(() => null)
  return body !== null && typeof body === 'object' && !Array.isArray(body)
    ? (body as Body)
    : null
}

// 별점은 1~5 정수 — 숫자 문자열 "5"는 받고 소수는 400이다.
const parseRating = (value: unknown) => {
  const rating = typeof value === 'string' ? Number(value) : value
  return Number.isInteger(rating) &&
    (rating as number) >= 1 &&
    (rating as number) <= 5
    ? (rating as number)
    : null
}

// 앞뒤 공백을 뺀 1~2,000자. JS 문자열 길이라 서버처럼 이모지가 2자로 세진다.
const parseBody = (value: unknown) => {
  const body = typeof value === 'string' ? value.trim() : ''
  return body.length >= 1 && body.length <= BODY_MAX ? body : null
}

// 모르는 칸은 400이다.
const unknownFields = (body: Body, allowed: string[]): ApiViolation[] =>
  Object.keys(body)
    .filter((key) => !allowed.includes(key))
    .map((key) => ({ field: key, message: `알 수 없는 칸입니다: ${key}` }))

const ratingViolation = {
  field: 'rating',
  message: '1~5 사이의 정수여야 합니다.',
}
const bodyViolation = {
  field: 'body',
  message: `1~${BODY_MAX.toLocaleString()}자로 입력해 주세요.`,
}

export const reviewHandlers: RequestHandler[] = [
  // 구매후기 모아보기 — 상위 카테고리면 하위 상품 리뷰까지. 없는 카테고리는 빈 목록.
  http.get(url('/api/v1/reviews'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const { page, size, violations } = readPaging(params)
    const categoryId = params.get('categoryId')
    if (categoryId && !isUuid(categoryId))
      violations.push(uuidViolation('categoryId'))
    if (violations.length > 0) return invalid(violations)

    const scope = categoryId ? categoryScope(categoryId) : null
    const matched = reviews
      .filter(
        (review) =>
          isVisible(review) &&
          (!scope ||
            scope.includes(findProduct(review.productId)?.categoryId ?? '')),
      )
      .sort(newestFirst)
      .map(toPublic)
    return ok<PageResponse<ReviewView>>(toPage(matched, page, size))
  }),

  // 내 리뷰 — 상품 공개 여부와 상관없이 전부, orderItemId가 채워져 온다.
  http.get(url('/api/v1/reviews/mine'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const params = new URL(request.url).searchParams
    const { page, size, violations } = readPaging(params)
    const orderItemId = params.get('orderItemId')
    if (orderItemId && !isUuid(orderItemId))
      violations.push(uuidViolation('orderItemId'))
    if (violations.length > 0) return invalid(violations)

    const matched = reviews
      .filter(
        (review) =>
          isMine(review) &&
          (!orderItemId || review.orderItemId === orderItemId),
      )
      .sort(newestFirst)
    return ok<PageResponse<ReviewView>>(toPage(matched, page, size))
  }),

  http.post(url('/api/v1/reviews'), async ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const body = await readBody(request)
    if (!body)
      return invalid([{ field: 'body', message: '본문이 비었습니다.' }])

    const rating = parseRating(body.rating)
    const text = parseBody(body.body)
    const orderItemId =
      typeof body.orderItemId === 'string' ? body.orderItemId : ''
    const violations: ApiViolation[] = [
      ...unknownFields(body, ['orderItemId', 'rating', 'body']),
      ...(isUuid(orderItemId) ? [] : [uuidViolation('orderItemId')]),
      ...(rating === null ? [ratingViolation] : []),
      ...(text === null ? [bodyViolation] : []),
    ]
    if (violations.length > 0 || rating === null || text === null)
      return invalid(violations)

    const orderItem = myOrderItems.find(
      (item) => item.orderItemId === orderItemId,
    )
    const product = products.find(
      ({ productId }) => productId === orderItem?.productId,
    )
    if (!orderItem || !product) return notFound()
    if (!orderItem.delivered || product.saleMode === 'PREORDER') {
      return fail(409, {
        code: 'REVIEW_NOT_ALLOWED',
        message:
          product.saleMode === 'PREORDER'
            ? '사전예약 상품은 리뷰를 쓸 수 없습니다.'
            : '배송이 완료된 뒤에 리뷰를 쓸 수 있습니다.',
      })
    }
    if (reviews.some((review) => review.orderItemId === orderItemId)) {
      return fail(409, {
        code: 'REVIEW_ALREADY_WRITTEN',
        message: '이미 리뷰를 작성한 상품입니다.',
      })
    }

    const now = new Date().toISOString()
    const created: ReviewView = {
      reviewId: crypto.randomUUID(),
      productId: product.productId,
      productTitle: product.title,
      optionTitle: orderItem.optionTitle,
      imageUrl: product.imageUrl,
      rating,
      body: text,
      authorName: MY_AUTHOR_NAME,
      createdAt: now,
      updatedAt: now,
      orderItemId,
    }
    reviews = [created, ...reviews]
    return ok(created, 201)
  }),

  // 보낸 칸만 바뀐다. 생략하거나 null이면 그대로, 둘 다 없으면 'body'로 400.
  http.patch(url('/api/v1/reviews/:reviewId'), async ({ params, request }) => {
    if (!hasToken(request)) return unauthenticated()
    const idErrors = idViolations(params, 'reviewId')
    if (idErrors.length > 0) return invalid(idErrors)
    const body = await readBody(request)
    if (!body)
      return invalid([{ field: 'body', message: '본문이 비었습니다.' }])

    const patch: ReviewUpdateRequest = {}
    const violations = unknownFields(body, ['rating', 'body'])
    if (body.rating != null) {
      const rating = parseRating(body.rating)
      if (rating === null) violations.push(ratingViolation)
      else patch.rating = rating
    }
    if (body.body != null) {
      const text = parseBody(body.body)
      if (text === null) violations.push(bodyViolation)
      else patch.body = text
    }
    if (violations.length === 0 && Object.keys(patch).length === 0)
      violations.push({ field: 'body', message: '바꿀 값을 보내 주세요.' })
    if (violations.length > 0) return invalid(violations)

    // 남의 리뷰와 없는 리뷰는 구분 없이 404다.
    const target = reviews.find(
      (review) => review.reviewId === params.reviewId && isMine(review),
    )
    if (!target) return notFound()
    const updated = { ...target, ...patch, updatedAt: new Date().toISOString() }
    reviews = reviews.map((review) => (review === target ? updated : review))
    return ok(updated)
  }),

  // 지우면 같은 주문상품에 다시 쓸 수 있다.
  http.delete(url('/api/v1/reviews/:reviewId'), ({ params, request }) => {
    if (!hasToken(request)) return unauthenticated()
    const idErrors = idViolations(params, 'reviewId')
    if (idErrors.length > 0) return invalid(idErrors)
    const target = reviews.find(
      (review) => review.reviewId === params.reviewId && isMine(review),
    )
    if (!target) return notFound()
    reviews = reviews.filter((review) => review !== target)
    return new HttpResponse(null, { status: 204 })
  }),

  // 상품 상세의 구매 후기 탭 — 상품이 상세에서 404면 여기도 404.
  http.get(
    url('/api/v1/products/:productId/reviews'),
    ({ params, request }) => {
      const { page, size, violations } = readPaging(
        new URL(request.url).searchParams,
      )
      violations.push(...idViolations(params, 'productId'))
      if (violations.length > 0) return invalid(violations)
      if (!findProduct(String(params.productId))) return notFound()

      const matched = reviews
        .filter((review) => review.productId === params.productId)
        .sort(newestFirst)
        .map(toPublic)
      return ok<PageResponse<ReviewView>>(toPage(matched, page, size))
    },
  ),
]
