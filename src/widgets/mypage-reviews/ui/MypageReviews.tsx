import { MessageSquare } from 'lucide-react'

import { HistoryCard, HistoryListSkeleton } from '@entities/order'
import { ProductPaymentCard } from '@entities/product'
import { useDeleteReview, useMyReviews, type Review } from '@entities/review'
import { openReviewForm } from '@features/review-write'
import { getErrorMessage } from '@shared/api/client'
import { formatDotDate } from '@shared/lib/formatDotDate'
import { showToast } from '@shared/model/toastStore'
import { Button, InlineAlert } from '@shared/ui'

import * as styles from './MypageReviews.css'

const MAX_RATING = 5

const WRITTEN_TAG = { label: '리뷰 작성 완료', color: 'gray' } as const

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

// 내가 쓴 리뷰(GET /reviews/mine) — 수정·삭제만 한다. 새 리뷰는 주문 내역의 배송 완료 주문상품에서 쓴다.
export function MypageReviews() {
  const { data, isPending, isError, error } = useMyReviews()
  const removeReview = useDeleteReview()

  const reviews = data?.items ?? []

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

      {isError ? (
        <div className={styles.empty}>
          {getErrorMessage(error, '리뷰를 불러오지 못했어요.')}
        </div>
      ) : isPending ? (
        <HistoryListSkeleton />
      ) : (
        reviews.length === 0 && (
          <InlineAlert
            status="info"
            variant="big"
            icon={MessageSquare}
            description="리뷰는 배송 완료된 일반 구매 상품에 쓸 수 있어요."
          >
            아직 작성한 리뷰가 없어요
          </InlineAlert>
        )
      )}

      {reviews.map((review) => (
        <HistoryCard
          key={review.reviewId}
          tag={WRITTEN_TAG}
          orderDate={formatDotDate(review.createdAt)}
          items={[toItem(review)]}
          renderItem={(product) => <ProductPaymentCard product={product} />}
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
        >
          <div className={styles.reviewArea}>
            <div className={styles.review}>
              <div className={styles.reviewMeta}>
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
                <span className={styles.reviewDate}>
                  {formatDotDate(review.createdAt)} 작성
                </span>
              </div>
              <div className={styles.reviewText}>{review.body}</div>
            </div>
          </div>
        </HistoryCard>
      ))}
    </div>
  )
}
