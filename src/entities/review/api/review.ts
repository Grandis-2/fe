import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  MyReviewListParams,
  PageResponse,
  ReviewCreateRequest,
  ReviewListParams,
  ReviewUpdateRequest,
} from '@shared/api/types'

import type { Review } from '../model/review'

type ReviewPage = PageResponse<Review>

// 구매후기 모아보기(로그인 없이). 최신순 고정.
export const getReviews = (params: ReviewListParams, signal?: AbortSignal) =>
  apiClient.request<ReviewPage>(`/api/v1/reviews${toQueryString(params)}`, {
    signal,
  })

// 상품 상세의 구매 후기 탭(로그인 없이). 상품이 상세에서 404면 여기도 404.
export const getProductReviews = (
  productId: string,
  params: Pick<ReviewListParams, 'page' | 'size'>,
  signal?: AbortSignal,
) =>
  apiClient.request<ReviewPage>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews${toQueryString(params)}`,
    { signal },
  )

// 내 리뷰(회원). 상품 공개 여부와 상관없이 전부 오고 orderItemId가 채워진다.
export const getMyReviews = (
  params: MyReviewListParams,
  signal?: AbortSignal,
) =>
  apiClient.request<ReviewPage>(
    `/api/v1/reviews/mine${toQueryString(params)}`,
    { signal },
  )

export const createReview = (body: ReviewCreateRequest) =>
  apiClient.request<Review>('/api/v1/reviews', { method: 'POST', body })

// 보낸 칸만 바뀐다.
export const updateReview = ({
  reviewId,
  ...body
}: ReviewUpdateRequest & Pick<Review, 'reviewId'>) =>
  apiClient.request<Review>(`/api/v1/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PATCH',
    body,
  })

// 204 — 본문 없음. 지우면 같은 주문상품에 다시 쓸 수 있다.
export const deleteReview = (reviewId: string) =>
  apiClient.request<void>(`/api/v1/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
  })
