import { useState } from 'react'

import { HistoryCard, MOCK_ORDERS } from '@entities/order'
import { ProductPaymentCard } from '@entities/product'
import { myReviewKey, useMyReviewStore } from '@entities/review'
import { ReviewFormModal, type ReviewTarget } from '@features/review-write'
import { showToast } from '@shared/model/toastStore'
import { ActionButton, Button, SelectButton } from '@shared/ui'

import * as styles from './MypageReviews.css'

const MAX_RATING = 5

// 리뷰는 배송 완료된 상품마다 하나씩 쓸 수 있다.
const deliveredItems = MOCK_ORDERS.filter(
  (order) => order.status === 'delivered',
).flatMap((order) =>
  order.items.map((item, index) => ({
    key: myReviewKey(order.orderNumber, index),
    order,
    item,
  })),
)

type Filter = 'all' | 'writable' | 'written'

export function MypageReviews() {
  const reviews = useMyReviewStore((state) => state.reviews)
  const removeReview = useMyReviewStore((state) => state.remove)
  const [filter, setFilter] = useState<Filter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [target, setTarget] = useState<ReviewTarget | null>(null)

  const writable = deliveredItems.filter(({ key }) => !reviews[key])
  const written = deliveredItems
    .filter(({ key }) => reviews[key])
    .map((entry) => ({ ...entry, review: reviews[entry.key] }))
    .sort((a, b) => b.review.writtenAt.localeCompare(a.review.writtenAt))

  const showWritable = filter !== 'written'
  const showWritten = filter !== 'writable'
  const isEmpty =
    (!showWritable || writable.length === 0) &&
    (!showWritten || written.length === 0)

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'writable', label: `작성 가능 ${writable.length}` },
    { value: 'written', label: `작성 완료 ${written.length}` },
  ]

  const openForm = ({ key, item }: (typeof deliveredItems)[number]) => {
    setTarget({
      key,
      productName: item.name,
      optionSummary: item.optionSummary,
    })
    setFormOpen(true)
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>내 리뷰</h1>

      <div className={styles.chips}>
        {filters.map(({ value, label }) => (
          <SelectButton
            key={value}
            className={styles.chip}
            selected={value === filter}
            onClick={() => setFilter(value)}
          >
            {label}
          </SelectButton>
        ))}
      </div>

      {isEmpty && (
        <div className={styles.empty}>
          {filter === 'writable'
            ? '리뷰를 쓸 수 있는 상품이 없어요.'
            : '아직 작성한 리뷰가 없어요.'}
        </div>
      )}

      {showWritable &&
        writable.map((entry) => (
          <HistoryCard
            key={entry.key}
            status={entry.order.status}
            badge={{ label: '리뷰 작성 가능', color: 'primary' }}
            orderDate={entry.order.orderDate.replaceAll('-', '.')}
            orderNumber={entry.order.orderNumber}
            items={[entry.item]}
            renderItem={(product) => <ProductPaymentCard product={product} />}
            footer={
              <ActionButton size="md" fullWidth onClick={() => openForm(entry)}>
                리뷰 쓰기
              </ActionButton>
            }
          />
        ))}

      {showWritten &&
        written.map((entry) => (
          <HistoryCard
            key={entry.key}
            status={entry.order.status}
            badge={{ label: '리뷰 작성 완료', color: 'gray' }}
            orderDate={entry.order.orderDate.replaceAll('-', '.')}
            orderNumber={entry.order.orderNumber}
            items={[entry.item]}
            renderItem={(product) => <ProductPaymentCard product={product} />}
            footer={
              <div className={styles.actions}>
                <Button
                  variant="subtle"
                  color="cancel"
                  onClick={() => {
                    removeReview(entry.key)
                    showToast('리뷰를 삭제했어요.')
                  }}
                >
                  리뷰 삭제
                </Button>
                <Button
                  variant="subtle"
                  color="cancel"
                  onClick={() => openForm(entry)}
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
                    aria-label={`별점 ${entry.review.rating}점`}
                  >
                    {'★'.repeat(entry.review.rating)}
                    <span className={styles.starsEmpty}>
                      {'★'.repeat(MAX_RATING - entry.review.rating)}
                    </span>
                  </span>
                  <span className={styles.reviewDate}>
                    {entry.review.writtenAt} 작성
                  </span>
                </div>
                <div className={styles.reviewText}>{entry.review.text}</div>
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
