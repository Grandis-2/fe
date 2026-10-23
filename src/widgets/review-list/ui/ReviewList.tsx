import { useState } from 'react'

import { MessageSquare } from 'lucide-react'

import { useCategories } from '@entities/product'
import { ReviewCard, ReviewCardSkeleton, useReviews } from '@entities/review'
import { useEndReached } from '@shared/lib/useEndReached'
import { Button, Chip, InlineAlert, SkeletonGroup } from '@shared/ui'

import * as styles from './ReviewList.css'

const skeletons = (count: number) =>
  Array.from({ length: count }, (_, i) => <ReviewCardSkeleton key={i} />)

// 구매후기 모아보기 — 상위 카테고리로 거르고(하위 상품 후기까지 나온다), 끝에 닿으면 다음 쪽을 붙인다.
export function ReviewList() {
  const [categoryId, setCategoryId] = useState<string>()
  const categories = useCategories()
  const {
    data,
    isError,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useReviews({ categoryId })
  const reviews = data?.pages.flatMap(({ items }) => items) ?? []

  // 목록 끝 표시가 화면 가까이(400px) 오면 다음 쪽을 받는다. 다음 쪽이 실패하면 멈추고
  // 버튼으로 다시 받는다(계속 두드리지 않게).
  const endRef = useEndReached<HTMLDivElement>(
    hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
    () => void fetchNextPage(),
    '400px',
  )

  return (
    <div className={styles.root}>
      {/* 카테고리를 못 받으면 거르기 없이 전체만 보인다. */}
      {categories.data && (
        <div className={styles.chips} role="group" aria-label="카테고리">
          <Chip
            selected={categoryId === undefined}
            onClick={() => setCategoryId(undefined)}
          >
            전체
          </Chip>
          {categories.data.map(({ categoryId: id, name }) => (
            <Chip
              key={id}
              selected={id === categoryId}
              onClick={() => setCategoryId(id)}
            >
              {name}
            </Chip>
          ))}
        </div>
      )}

      {/* 다음 쪽 실패도 isError가 켜지므로, 받은 게 없을 때만 목록 실패로 본다. */}
      {!data ? (
        isError ? (
          <InlineAlert status="error">후기를 불러오지 못했어요.</InlineAlert>
        ) : (
          <SkeletonGroup className={styles.list}>{skeletons(3)}</SkeletonGroup>
        )
      ) : reviews.length === 0 ? (
        <InlineAlert status="info" variant="big" icon={MessageSquare}>
          아직 등록된 후기가 없어요
        </InlineAlert>
      ) : (
        <div className={styles.list}>
          {reviews.map((review) => (
            <ReviewCard key={review.reviewId} review={review} />
          ))}
        </div>
      )}

      {isFetchingNextPage && (
        <SkeletonGroup className={styles.list}>{skeletons(1)}</SkeletonGroup>
      )}
      {isFetchNextPageError && (
        <div className={styles.retry}>
          <InlineAlert status="error">후기를 더 불러오지 못했어요.</InlineAlert>
          <Button variant="outline" onClick={() => void fetchNextPage()}>
            다시 불러오기
          </Button>
        </div>
      )}
      <div ref={endRef} aria-hidden="true" />
    </div>
  )
}
