import { useState } from 'react'

import { MessageSquare } from 'lucide-react'

import { HistoryCard, HistoryListSkeleton } from '@entities/order'
import { ProductPaymentCard } from '@entities/product'
import {
  useDeleteReview,
  useMyReviewPages,
  useWritableItems,
  type Review,
  type WritableItem,
} from '@entities/review'
import { openReviewForm } from '@features/review-write'
import { getErrorMessage } from '@shared/api/client'
import { formatDotDateMinute } from '@shared/lib/formatDotDate'
import { formatWon } from '@shared/lib/formatNumber'
import { shortId } from '@shared/lib/shortId'
import { useEndReached } from '@shared/lib/useEndReached'
import { showToast } from '@shared/model/toastStore'
import { ActionButton, Button, Chip, InlineAlert } from '@shared/ui'

import * as styles from './MypageReviews.css'

const MAX_RATING = 5

const WRITTEN_TAG = { label: '리뷰 작성 완료', color: 'gray' } as const
const WRITABLE_TAG = { label: '리뷰 작성 가능', color: 'primary' } as const

const FILTERS = ['전체', '작성 가능', '작성 완료'] as const
type Filter = (typeof FILTERS)[number]

const EMPTY_MESSAGE: Record<Filter, string> = {
  전체: '리뷰를 쓸 상품도, 작성한 리뷰도 없어요',
  '작성 가능': '리뷰를 쓸 수 있는 상품이 없어요',
  '작성 완료': '아직 작성한 리뷰가 없어요',
}

// 리뷰를 쓸 주문상품 한 줄 — 주문 당시 이름·옵션·사진·줄 금액으로 그린다.
const toWritableItem = (item: WritableItem) => ({
  productId: item.productId,
  imageSrc: item.imageUrl ?? undefined,
  name: item.productTitle,
  modelNumber: '',
  optionSummary: item.optionTitle,
  quantityLabel: `수량 ${item.quantity}개`,
  priceLabel: formatWon(item.lineAmount),
})

// 리뷰가 붙은 주문상품 한 줄 — 리뷰 응답의 상품명·구매 당시 옵션명·대표 사진으로 그린다.
const toItem = (review: Review) => ({
  productId: review.productId,
  imageSrc: review.imageUrl ?? undefined,
  name: review.productTitle,
  modelNumber: '',
  optionSummary: review.optionTitle,
  quantityLabel: '',
  priceLabel: '',
})

// 내 리뷰 — 작성 가능(GET /reviews/writable)과 작성 완료(GET /reviews/mine)를 칩으로 나눠 본다. 둘 다 20건씩 잇는다.
// 전체는 작성 가능을 끝까지 받은 뒤에 작성 완료를 붙인다 — 같이 붙이면 작성 가능 다음 쪽이 작성 완료 사이로 끼어든다.
export function MypageReviews() {
  const [filter, setFilter] = useState<Filter>('전체')
  const writable = useWritableItems()
  const written = useMyReviewPages()
  const removeReview = useDeleteReview()

  const writableItems = writable.data?.pages.flatMap(({ items }) => items) ?? []
  const reviews = written.data?.pages.flatMap(({ items }) => items) ?? []
  // 칩 숫자는 서버 total — 받기 전엔 비운다.
  const writableTotal = writable.data?.pages[0].total
  const writtenTotal = written.data?.pages[0].total
  const counts: Record<Filter, number | undefined> = {
    전체:
      writableTotal === undefined || writtenTotal === undefined
        ? undefined
        : writableTotal + writtenTotal,
    '작성 가능': writableTotal,
    '작성 완료': writtenTotal,
  }

  const showWritable = filter !== '작성 완료'
  const showWritten =
    filter === '작성 완료' ||
    (filter === '전체' && writable.data !== undefined && !writable.hasNextPage)
  // 이 칩에 필요한 목록 — 하나라도 처음 받기부터 실패하면 실패 문구, 받는 중이면 뼈대.
  const needed =
    filter === '작성 가능'
      ? [writable]
      : filter === '작성 완료'
        ? [written]
        : [writable, written]
  const error = needed.find((query) => !query.data && query.isError)?.error
  const isPending = needed.some((query) => query.isPending)
  const ready = !error && !isPending

  // 끝에 닿으면 이어 받을 목록 — 전체에선 작성 가능을 다 받은 뒤 작성 완료로 넘어간다. 다음 쪽이 실패하면 멈추고 버튼으로 다시 받는다.
  const tail = showWritten ? written : writable
  const endRef = useEndReached<HTMLDivElement>(
    ready &&
      tail.hasNextPage &&
      !tail.isFetchingNextPage &&
      !tail.isFetchNextPageError,
    () => void tail.fetchNextPage(),
    '400px',
  )

  const openForm = (review: Review) => {
    // 내 리뷰 응답에는 orderItemId가 늘 채워져 온다.
    if (!review.orderItemId) return
    openReviewForm({
      orderItemId: review.orderItemId,
      productName: review.productTitle,
      optionSummary: review.optionTitle,
      review,
    })
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>내 리뷰</h1>

      <div className={styles.chips}>
        {FILTERS.map((value) => (
          <Chip
            key={value}
            selected={value === filter}
            count={counts[value]}
            onClick={() => setFilter(value)}
          >
            {value}
          </Chip>
        ))}
      </div>

      {error ? (
        <div className={styles.empty}>
          {getErrorMessage(error, '리뷰를 불러오지 못했어요.')}
        </div>
      ) : isPending ? (
        <HistoryListSkeleton />
      ) : (
        counts[filter] === 0 && (
          <InlineAlert
            status="info"
            variant="big"
            icon={MessageSquare}
            description="리뷰는 배송 완료된 일반 구매 상품에 쓸 수 있어요."
          >
            {EMPTY_MESSAGE[filter]}
          </InlineAlert>
        )
      )}

      {ready &&
        showWritable &&
        writableItems.map((item) => (
          <HistoryCard
            key={item.orderItemId}
            tag={WRITABLE_TAG}
            orderDate={formatDotDateMinute(item.orderedAt)}
            orderNumber={shortId(item.orderId)}
            items={[toWritableItem(item)]}
            renderItem={(product) => <ProductPaymentCard product={product} />}
            footer={
              <ActionButton
                size="md"
                fullWidth
                onClick={() =>
                  openReviewForm({
                    orderItemId: item.orderItemId,
                    productName: item.productTitle,
                    optionSummary: item.optionTitle,
                  })
                }
              >
                리뷰 쓰기
              </ActionButton>
            }
          />
        ))}

      {(ready && showWritten ? reviews : []).map((review) => (
        <HistoryCard
          key={review.reviewId}
          tag={WRITTEN_TAG}
          orderDate={formatDotDateMinute(review.createdAt)}
          items={[toItem(review)]}
          // 사진 오른쪽에 상품명·옵션, 그 아래 별점과 내가 쓴 글.
          renderItem={(product) => (
            <ProductPaymentCard product={product}>
              <div className={styles.review}>
                <span
                  className={styles.stars}
                  role="img"
                  aria-label={`별점 ${review.rating}점`}
                >
                  {'★'.repeat(review.rating)}
                  <span className={styles.starsEmpty}>
                    {'★'.repeat(MAX_RATING - review.rating)}
                  </span>
                </span>
                <div className={styles.reviewText}>{review.body}</div>
              </div>
            </ProductPaymentCard>
          )}
          footer={
            <div className={styles.actions}>
              <Button
                variant="subtle"
                color="cancel"
                // 지우는 중인 카드의 버튼만 막는다(중복 삭제 방지).
                disabled={
                  removeReview.isPending &&
                  removeReview.variables === review.reviewId
                }
                onClick={() =>
                  removeReview.mutate(review.reviewId, {
                    onSuccess: () => showToast('리뷰를 삭제했어요.'),
                    onError: (caught) =>
                      showToast(
                        getErrorMessage(caught, '리뷰를 삭제하지 못했어요.'),
                      ),
                  })
                }
              >
                리뷰 삭제
              </Button>
              <Button
                variant="subtle"
                color="cancel"
                onClick={() => openForm(review)}
              >
                리뷰 수정
              </Button>
            </div>
          }
        />
      ))}

      {tail.isFetchingNextPage && <HistoryListSkeleton count={1} />}
      {tail.isFetchNextPageError && (
        <div className={styles.retry}>
          <InlineAlert status="error">리뷰를 더 불러오지 못했어요.</InlineAlert>
          <Button variant="outline" onClick={() => void tail.fetchNextPage()}>
            다시 불러오기
          </Button>
        </div>
      )}
      <div ref={endRef} aria-hidden="true" />
    </div>
  )
}
