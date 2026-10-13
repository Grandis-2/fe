import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { ReviewListParams } from '@shared/api/types'

import {
  createReview,
  deleteReview,
  getMyReviews,
  getProductReviews,
  getReviews,
  updateReview,
} from './review'

// ponytail: 목록은 첫 쪽(최대 100건)만 받는다 — 화면에 페이지 넘김이 생기면 page를 인자로 올린다.
const FIRST_PAGE = { page: 0, size: 100 }

const reviewKeys = {
  all: ['reviews'] as const,
  list: (params: ReviewListParams) => ['reviews', 'list', params] as const,
  product: (productId: string) => ['reviews', 'product', productId] as const,
  mine: ['reviews', 'mine'] as const,
}

export const useReviews = (
  params: Omit<ReviewListParams, 'page' | 'size'> = {},
) =>
  useQuery({
    queryKey: reviewKeys.list(params),
    queryFn: ({ signal }) => getReviews({ ...params, ...FIRST_PAGE }, signal),
    ...queryPolicy.catalog,
  })

export const useProductReviews = (
  productId: string,
  { enabled = true }: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: reviewKeys.product(productId),
    queryFn: ({ signal }) => getProductReviews(productId, FIRST_PAGE, signal),
    enabled: enabled && productId !== '',
    ...queryPolicy.catalog,
  })

// 주문상품마다 리뷰를 따로 묻지 않고 내 리뷰 전체를 받아 orderItemId로 찾는다.
export const useMyReviews = () =>
  useQuery({
    queryKey: reviewKeys.mine,
    queryFn: ({ signal }) => getMyReviews(FIRST_PAGE, signal),
    ...queryPolicy.account,
  })

// 쓰기·고치기·지우기 모두 서버 확인 뒤 반영한다 — 내 리뷰와 공개 목록(평점·후기 수)이 함께 바뀌므로 리뷰 캐시를 통째로 다시 받는다.
const useReviewMutation = <TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: reviewKeys.all }),
  })
}

export const useCreateReview = () => useReviewMutation(createReview)
export const useUpdateReview = () => useReviewMutation(updateReview)
export const useDeleteReview = () => useReviewMutation(deleteReview)
