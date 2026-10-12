import { useState } from 'react'

import { HistoryCard } from '@entities/order'
import { ProductPaymentCard } from '@entities/product'
import { useDeleteReview, useMyReviews, type Review } from '@entities/review'
import { ReviewFormModal, type ReviewTarget } from '@features/review-write'
import { getErrorMessage } from '@shared/api/client'
import { formatDotDate } from '@shared/lib/formatDotDate'
import { showToast } from '@shared/model/toastStore'
import { Button } from '@shared/ui'

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

// 내가 쓴 리뷰(GET /reviews/mine). 리뷰 쓰기는 배송 완료된 일반 구매 주문상품(orderItemId)이 있어야 하는데,
// 주문 API가 아직 사전예약 주문만 주고 주문상품 id도 내려주지 않아 여기서는 쓴 리뷰의 수정·삭제만 한다.
export function MypageReviews() {
  const { data, isPending, isError, error } = useMyReviews()
  const removeReview = useDeleteReview()
  const [formOpen, setFormOpen] = useState(false)
  const [target, setTarget] = useState<ReviewTarget | null>(null)

  const reviews = data?.items ?? []

  const openForm = (review: Review) => {
    // 내 리뷰 응답에는 orderItemId가 늘 채워져 온다.
    if (!review.orderItemId) return
    setTarget({
      orderItemId: review.orderItemId,
      productName: review.productTitle,
      optionSummary: review.optionTitle,
      review,
    })
    setFormOpen(true)
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>내 리뷰</h1>

      {isError ? (
        <div className={styles.empty}>
          {getErrorMessage(error, '리뷰를 불러오지 못했어요.')}
        </div>
      ) : isPending ? (
        <div className={styles.empty}>리뷰를 불러오는 중이에요.</div>
      ) : (
        reviews.length === 0 && (
          <div className={styles.empty}>
            아직 작성한 리뷰가 없어요. 리뷰는 배송 완료된 일반 구매 상품에 쓸 수
            있어요.
          </div>
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

      <ReviewFormModal
        open={formOpen}
        target={target}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}
