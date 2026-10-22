import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

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

// ponytail: 상품 리뷰·내 리뷰는 첫 쪽(최대 100건)만 받는다 — 화면에 페이지 넘김이 생기면 page를 인자로 올린다.
const FIRST_PAGE = { page: 0, size: 100 }

// 모아보기는 20건씩 이어 받는다. 서버는 page × size가 10,000 이상이면 400이라 그 앞에서 멈춘다.
const FEED_SIZE = 20
const FEED_LIMIT = 10_000

const reviewKeys = {
  all: ['reviews'] as const,
  list: (params: ReviewListParams) => ['reviews', 'list', params] as const,
  product: (productId: string) => ['reviews', 'product', productId] as const,
  mine: ['reviews', 'mine'] as const,
}

// 구매후기 모아보기 — 끝에 닿을 때마다 fetchNextPage로 다음 쪽을 붙인다(무한 스크롤).
export const useReviews = (
  params: Omit<ReviewListParams, 'page' | 'size'> = {},
) =>
  useInfiniteQuery({
    queryKey: reviewKeys.list(params),
    queryFn: ({ pageParam, signal }) =>
      getReviews({ ...params, page: pageParam, size: FEED_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: ({ hasNext, page }) =>
      hasNext && (page + 1) * FEED_SIZE < FEED_LIMIT ? page + 1 : undefined,
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
