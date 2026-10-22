import { useState } from 'react'

import { MessageSquare } from 'lucide-react'

import {
  HistoryCard,
  HistoryListSkeleton,
  isReviewableOrder,
  useOrders,
  type Order,
} from '@entities/order'
import { ProductPaymentCard } from '@entities/product'
import { useDeleteReview, useMyReviews, type Review } from '@entities/review'
import { openReviewForm } from '@features/review-write'
import { getErrorMessage } from '@shared/api/client'
import { formatDotDateMinute } from '@shared/lib/formatDotDate'
import { formatWon } from '@shared/lib/formatNumber'
import { shortId } from '@shared/lib/shortId'
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

type OrderItem = Order['items'][number]

// 리뷰를 쓸 주문상품 한 줄 — 주문 당시 이름·옵션·사진·줄 금액으로 그린다.
const toWritableItem = (item: OrderItem) => ({
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

// 내 리뷰 — 작성 가능(배송 완료된 일반 구매 주문상품 중 리뷰가 없는 것)과 작성 완료(GET /reviews/mine)를 칩으로 나눠 본다.
// 쓸 수 있는 주문상품을 주는 API가 없어 주문 목록과 내 리뷰로 고른다.
// ponytail: 주문은 첫 쪽(최대 100건)만 받는다(useOrders) — 그보다 오래된 주문은 주문 내역에서 쓴다.
export function MypageReviews() {
  const [filter, setFilter] = useState<Filter>('전체')
  const myReviews = useMyReviews()
  const orders = useOrders()
  const removeReview = useDeleteReview()

  const reviews = myReviews.data?.items ?? []
  const reviewed = new Set(reviews.map(({ orderItemId }) => orderItemId))
  const writable = (orders.data?.items ?? [])
    .filter(isReviewableOrder)
    .flatMap((order) =>
      order.items
        .filter((item) => !reviewed.has(item.orderItemId))
        .map((item) => ({ order, item })),
    )

  // 작성 가능은 주문과 내 리뷰를 둘 다 받아야 고를 수 있다. 작성 완료만 볼 땐 주문을 기다리지 않는다.
  const showWritable = filter !== '작성 완료'
  const showWritten = filter !== '작성 가능'
  const error = myReviews.error ?? (showWritable ? orders.error : null)
  const isPending = myReviews.isPending || (showWritable && orders.isPending)
  const counts: Record<Filter, number> = {
    전체: writable.length + reviews.length,
    '작성 가능': writable.length,
    '작성 완료': reviews.length,
  }
  const ready = !error && !isPending

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
            // 주문을 아직 못 받았으면 작성 가능 수를 모르니 숫자를 비운다.
            count={
              myReviews.data && (value === '작성 완료' || orders.data)
                ? counts[value]
                : undefined
            }
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
        writable.map(({ order, item }) => (
          <HistoryCard
            key={item.orderItemId}
            tag={WRITABLE_TAG}
            orderDate={formatDotDateMinute(order.createdAt)}
            orderNumber={shortId(order.orderId)}
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
    </div>
  )
}
