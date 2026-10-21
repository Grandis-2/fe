import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiRequestError } from '@shared/api/client'
import { queryPolicy } from '@shared/api/queryPolicy'
import { useIdempotencyKey } from '@shared/lib/useIdempotencyKey'

import {
  toPromotionLinkableProduct,
  toPromotionRequest,
  type AdminPromotionFormValue,
} from '../model/types'

import {
  createAdminPromotion,
  getAdminPromotion,
  getAdminPromotions,
  getPromotionLinkableProducts,
  updateAdminPromotion,
} from './adminPromotion'

// 목록·상세가 이 접두사로 시작해야 저장 뒤 한 번에 무효화된다.
const ADMIN_PROMOTIONS_KEY = ['admin', 'promotions'] as const

export const useAdminPromotions = () =>
  useQuery({
    queryKey: ADMIN_PROMOTIONS_KEY,
    queryFn: ({ signal }) => getAdminPromotions(signal),
    ...queryPolicy.live,
  })

export const useAdminPromotion = (promotionId: string) =>
  useQuery({
    queryKey: [...ADMIN_PROMOTIONS_KEY, promotionId],
    queryFn: ({ signal }) => getAdminPromotion(promotionId, signal),
    ...queryPolicy.live,
  })

/** 묶을 상품 후보. 수정 화면은 promotionId를 넘겨야 이미 묶인 상품도 보인다 */
export const usePromotionLinkableProducts = (promotionId?: string) =>
  useQuery({
    queryKey: [...ADMIN_PROMOTIONS_KEY, 'linkable-products', promotionId],
    queryFn: ({ signal }) => getPromotionLinkableProducts(promotionId, signal),
    select: (products) => products.map(toPromotionLinkableProduct),
    ...queryPolicy.live,
  })

/**
 * 만들기 키는 응답을 받을 때까지 유지한다 — 응답을 못 받았거나 서버 장애로 실패한 뒤 다시
 * 누르면 같은 키로 보내 홍보가 둘 생기지 않는다. 서버가 본문을 보고 거절한 4xx(겹친 요청
 * 409 retryable 제외)는 고쳐서 새로 보내는 것이라 키를 버린다.
 */
export const useCreateAdminPromotion = () => {
  const queryClient = useQueryClient()
  const idempotency = useIdempotencyKey()
  return useMutation({
    mutationFn: async (value: AdminPromotionFormValue) => {
      const request = toPromotionRequest(value)
      const key = idempotency.keyFor(request)
      if (key === null) {
        // 결과를 모르는 채 본문이 바뀌었다. 한 상품은 홍보 하나에만 묶여서 이전 요청이
        // 반영됐다면 새 키로 보내도 409로 막힌다 — 확인 문구만 띄우고 다음엔 새 키로 보낸다.
        idempotency.forget()
        throw new PromotionUnconfirmedError()
      }
      const created = await createAdminPromotion(key, request)
      idempotency.forget()
      return created
    },
    onError: (caught) => {
      if (
        caught instanceof ApiRequestError &&
        caught.status >= 400 &&
        caught.status < 500 &&
        caught.error.details?.retryable !== true
      ) {
        idempotency.forget()
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_PROMOTIONS_KEY }),
  })
}

export const useUpdateAdminPromotion = (promotionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (value: AdminPromotionFormValue) =>
      updateAdminPromotion(promotionId, toPromotionRequest(value)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_PROMOTIONS_KEY }),
  })
}

/** 이전 등록의 결과를 모르는데 본문이 바뀌었다 — 목록에서 확인한 뒤 다시 누른다 */
export class PromotionUnconfirmedError extends Error {
  constructor() {
    super(
      '이전 등록 결과를 확인하지 못했습니다. 목록에서 등록됐는지 확인한 뒤 다시 눌러 주세요.',
    )
    this.name = 'PromotionUnconfirmedError'
  }
}
