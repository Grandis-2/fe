import {
  keepPreviousData,
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
  getWritableItems,
  updateReview,
} from './review'

// ponytail: 주문 내역의 리뷰 버튼은 내 리뷰 첫 쪽(최대 100건)에서 찾는다 — 그보다 오래된 리뷰는 '리뷰 쓰기'로 보이고 서버가 409로 막는다.
const FIRST_PAGE = { page: 0, size: 100 }

// 상품 상세의 구매 후기는 10건씩 쪽 번호로 넘긴다.
const PRODUCT_PAGE_SIZE = 10

// 이어 받는 목록(모아보기·내 리뷰·작성 가능)은 20건씩. 서버는 page × size가 10,000 이상이면 400이라 그 앞에서 멈춘다.
const FEED_SIZE = 20
const FEED_LIMIT = 10_000
const nextFeedPage = ({ hasNext, page }: { hasNext: boolean; page: number }) =>
  hasNext && (page + 1) * FEED_SIZE < FEED_LIMIT ? page + 1 : undefined

const reviewKeys = {
  all: ['reviews'] as const,
  list: (params: ReviewListParams) => ['reviews', 'list', params] as const,
  product: (productId: string, page: number) =>
    ['reviews', 'product', productId, page] as const,
  mine: ['reviews', 'mine'] as const,
  minePages: ['reviews', 'mine', 'pages'] as const,
  writable: ['reviews', 'writable'] as const,
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
    getNextPageParam: nextFeedPage,
    ...queryPolicy.catalog,
  })

// 내 리뷰 화면 — 작성 완료 목록을 20건씩 잇는다. 첫 쪽의 total이 '작성 완료' 칩 숫자다.
export const useMyReviewPages = () =>
  useInfiniteQuery({
    queryKey: reviewKeys.minePages,
    queryFn: ({ pageParam, signal }) =>
      getMyReviews({ page: pageParam, size: FEED_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: nextFeedPage,
    ...queryPolicy.account,
  })

// 리뷰를 쓸 수 있는 주문상품 — 20건씩 잇는다. 첫 쪽의 total이 '작성 가능' 칩 숫자다.
// 리뷰를 쓰거나 지우면 아래 mutation이 리뷰 캐시를 통째로 다시 받아 목록에서 빠지거나 다시 나온다.
export const useWritableItems = () =>
  useInfiniteQuery({
    queryKey: reviewKeys.writable,
    queryFn: ({ pageParam, signal }) =>
      getWritableItems({ page: pageParam, size: FEED_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: nextFeedPage,
    ...queryPolicy.account,
  })

// 상품 상세의 구매 후기 — 쪽(page, 0부터)마다 받는다. 쪽을 바꾸는 동안엔 앞 쪽을 그대로 둔다(isPlaceholderData).
// 상품이 바뀌면 앞 상품의 후기가 남지 않게 쓰는 쪽이 key={productId}로 다시 마운트한다.
export const useProductReviews = (productId: string, page: number) =>
  useQuery({
    queryKey: reviewKeys.product(productId, page),
    queryFn: ({ signal }) =>
      getProductReviews(productId, { page, size: PRODUCT_PAGE_SIZE }, signal),
    enabled: productId !== '',
    placeholderData: keepPreviousData,
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
