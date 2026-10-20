import { http } from 'msw'

import { mockUuid, products } from '../fixtures/product'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { isUuid, uuidViolation } from '../validate'

import { toListItem } from './product'

import type {
  ProductDetailView,
  PromotionDetailView,
  PromotionListResponse,
  PromotionSummary,
} from '../../types'
import type { RequestHandler } from 'msw'

/*
 * 고객 사전예약 홍보 목업. 사전예약 상품마다 홍보 하나를 만들고, 첫 홍보에는 다음 상품도 묶어
 * 모델이 여럿인 화면을 볼 수 있게 한다. 관리자 홍보 목업과는 따로다(상품 목업이 서로 다르다).
 */
const preorderProducts = products.filter(
  (product) => product.saleMode === 'PREORDER',
)
const groups = [
  preorderProducts.slice(0, 2),
  ...preorderProducts.slice(2).map((product) => [product]),
]

const toDetail = (
  linked: ProductDetailView[],
  index: number,
): PromotionDetailView => {
  const [first] = linked
  const opens = linked.map((product) => product.campaign?.opensAt ?? '')
  const closes = linked.map((product) => product.campaign?.closesAt ?? '')
  return {
    promotionId: mockUuid(6, index + 1),
    name: `${first.title} 사전예약`,
    thumbnailUrl: first.imageUrl ?? '',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    // 가장 이른 오픈, 가장 늦은 마감(ISO 문자열이라 글자 순서가 곧 시간 순서다).
    opensAt: [...opens].sort()[0] || null,
    closesAt: [...closes].sort().at(-1) || null,
    detailImageUrls: [],
    products: linked.map(toListItem),
  }
}

const promotions = groups.map(toDetail)

const toSummary = ({
  detailImageUrls: _detailImageUrls,
  products: _products,
  ...summary
}: PromotionDetailView): PromotionSummary => summary

export const promotionHandlers: RequestHandler[] = [
  // 시작 날이 늦은 것부터 — 목업은 모두 같아 만든 순서 그대로 둔다.
  http.get(url('/api/v1/promotions'), () =>
    ok<PromotionListResponse>({ items: promotions.map(toSummary) }),
  ),

  http.get(url('/api/v1/promotions/:promotionId'), ({ params }) => {
    const promotionId = String(params.promotionId)
    if (!isUuid(promotionId)) return invalid([uuidViolation('promotionId')])
    const found = promotions.find(
      (promotion) => promotion.promotionId === promotionId,
    )
    return found
      ? ok(found)
      : fail(404, {
          code: 'PROMOTION_NOT_FOUND',
          message: '사전예약을 찾을 수 없어요.',
        })
  }),
]
