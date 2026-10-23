import { useState } from 'react'

import { MessageSquare } from 'lucide-react'

import {
  ReviewCard,
  ReviewCardSkeleton,
  useProductReviews,
} from '@entities/review'
import { Button, InlineAlert, Navigator, SkeletonGroup } from '@shared/ui'

import * as styles from './ProductReviews.css'

// 서버는 page × size가 10,000 이상인 쪽을 400으로 거절한다 — 그 앞 쪽까지만 넘길 수 있다.
const PAGE_WINDOW = 10_000

export type ProductReviewsProps = {
  productId: string
  // 쪽을 바꾼 뒤 — 상세는 구매 후기 칸 맨 위로 올린다.
  onPageChange?: () => void
}

// 상품 상세의 구매 후기 — 한 상품의 후기라 사진·상품명 없이 옵션만 보이고, 쪽 번호로 넘긴다.
// 상품이 바뀌면 1쪽부터 보도록 쓰는 쪽이 key={productId}를 준다.
export function ProductReviews({
  productId,
  onPageChange,
}: ProductReviewsProps) {
  // 화면은 1부터, API는 0부터 센다(검색 결과와 같다).
  const [page, setPage] = useState(1)
  const { data, isPending, isError, isPlaceholderData, isFetching, refetch } =
    useProductReviews(productId, page - 1)
  const totalPages = data
    ? Math.min(
        Math.ceil(data.total / data.size),
        Math.ceil(PAGE_WINDOW / data.size),
      )
    : 0

  // 몇 쪽에서 실패했든 그 쪽을 다시 받을 수 있게 한다 — 쪽 번호까지 사라져 갇히지 않게.
  if (isError)
    return (
      <div className={styles.root}>
        <InlineAlert status="error">후기를 불러오지 못했어요.</InlineAlert>
        <Button
          variant="outline"
          className={styles.retry}
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          다시 불러오기
        </Button>
      </div>
    )
  if (isPending)
    return (
      <SkeletonGroup className={styles.list}>
        {[0, 1].map((i) => (
          <ReviewCardSkeleton key={i} showProduct={false} />
        ))}
      </SkeletonGroup>
    )
  if (data.items.length === 0)
    return (
      <InlineAlert
        status="info"
        variant="big"
        icon={MessageSquare}
        description="첫 후기를 기다리고 있어요."
      >
        아직 등록된 후기가 없어요
      </InlineAlert>
    )

  return (
    <div className={styles.root}>
      <div
        className={[styles.list, isPlaceholderData && styles.listLoading]
          .filter(Boolean)
          .join(' ')}
        aria-busy={isPlaceholderData}
      >
        {data.items.map((review) => (
          <ReviewCard
            key={review.reviewId}
            review={review}
            showProduct={false}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <Navigator
          className={styles.pagination}
          totalPages={totalPages}
          currentPage={page}
          onPageChange={(next) => {
            if (next === page) return
            setPage(next)
            onPageChange?.()
          }}
        />
      )}
    </div>
  )
}
