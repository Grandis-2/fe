import { http } from 'msw'

import { fail, invalid, ok } from '../response'
import { url } from '../url'

import type {
  AdminPromotionStatus,
  AdminPromotionUpsertRequest,
  AdminPromotionView,
} from '../../types'
import type { RequestHandler } from 'msw'

/*
 * 사전예약 프로모션 목업. 백엔드에 아직 API가 없어서 실서버에 붙을 때(VITE_USE_MSW=
 * false)도 dev에서는 이 핸들러만 켜진다(mock/index.ts). 메모리에만 있어 새로고침하면
 * 사라진다.
 */
type StoredPromotion = Omit<AdminPromotionView, 'status' | 'publicUrl'>
const promotions: StoredPromotion[] = []

const today = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const statusOf = ({ startAt, endAt }: StoredPromotion): AdminPromotionStatus =>
  today() < startAt ? 'SCHEDULED' : today() > endAt ? 'ENDED' : 'ONGOING'

const toView = (promotion: StoredPromotion): AdminPromotionView => ({
  ...promotion,
  status: statusOf(promotion),
  publicUrl: `${location.origin}/preorder/${promotion.promotionId}`,
})

const DATE = /^\d{4}-\d{2}-\d{2}$/

async function readUpsert(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as Partial<AdminPromotionUpsertRequest> | null
  const name = body?.name?.trim() ?? ''
  const violations = [
    !name || name.length > 100
      ? { field: 'name', message: '1~100자여야 합니다.' }
      : null,
    !DATE.test(body?.startAt ?? '') || !DATE.test(body?.endAt ?? '')
      ? { field: 'startAt', message: '진행 기간이 필요합니다.' }
      : null,
    body?.startAt && body.endAt && body.endAt < body.startAt
      ? { field: 'endAt', message: '시작일 이후여야 합니다.' }
      : null,
  ].filter((violation) => violation !== null)

  if (!body || violations.length > 0) return { violations }
  return {
    value: {
      name,
      startAt: body.startAt ?? '',
      endAt: body.endAt ?? '',
      linkedProductIds: body.linkedProductIds ?? [],
      thumbnailUrl: body.thumbnailUrl ?? null,
      detailImageUrls: body.detailImageUrls ?? [],
    },
  }
}

const notFound = () =>
  fail(404, {
    code: 'PROMOTION_NOT_FOUND',
    message: '사전예약을 찾을 수 없습니다.',
  })

export const adminPromotionHandlers: RequestHandler[] = [
  http.get(url('/api/v1/admin/promotions'), () => ok(promotions.map(toView))),

  http.get(url('/api/v1/admin/promotions/:promotionId'), ({ params }) => {
    const found = promotions.find(
      (promotion) => promotion.promotionId === params.promotionId,
    )
    return found ? ok(toView(found)) : notFound()
  }),

  http.post(url('/api/v1/admin/promotions'), async ({ request }) => {
    const { value, violations } = await readUpsert(request)
    if (!value) return invalid(violations)

    const created = {
      promotionId: `PRM-${crypto.randomUUID().slice(0, 8)}`,
      ...value,
    }
    promotions.unshift(created)
    return ok(toView(created), 201)
  }),

  http.put(
    url('/api/v1/admin/promotions/:promotionId'),
    async ({ request, params }) => {
      const index = promotions.findIndex(
        (promotion) => promotion.promotionId === params.promotionId,
      )
      if (index < 0) return notFound()
      const { value, violations } = await readUpsert(request)
      if (!value) return invalid(violations)

      promotions[index] = { ...promotions[index], ...value }
      return ok(toView(promotions[index]))
    },
  ),
]
