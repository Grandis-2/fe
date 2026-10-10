import { ReviewCard, useReviews } from '@entities/review'
import { Container, InlineAlert } from '@shared/ui'

import * as styles from './ReviewsPage.css'

export function ReviewsPage() {
  const { data, isPending, isError } = useReviews()

  return (
    <Container>
      <div className={styles.title}>구매후기</div>
      {isError ? (
        <InlineAlert status="error">후기를 불러오지 못했어요.</InlineAlert>
      ) : isPending ? (
        <InlineAlert status="info">후기를 불러오는 중이에요.</InlineAlert>
      ) : data.items.length === 0 ? (
        <InlineAlert status="info">아직 등록된 후기가 없어요.</InlineAlert>
      ) : (
        <div className={styles.list}>
          {data.items.map((review) => (
            <ReviewCard key={review.reviewId} review={review} />
          ))}
        </div>
      )}
    </Container>
  )
}
