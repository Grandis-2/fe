import { mockReviews, ReviewCard } from '@entities/review'
import { Container, InlineAlert } from '@shared/ui'

import * as styles from './ReviewsPage.css'

export function ReviewsPage() {
  return (
    <Container>
      <div className={styles.title}>구매후기</div>
      {mockReviews.length === 0 ? (
        <InlineAlert status="info">아직 등록된 후기가 없어요.</InlineAlert>
      ) : (
        <div className={styles.list}>
          {mockReviews.map(({ id, ...review }) => (
            <ReviewCard key={id} {...review} />
          ))}
        </div>
      )}
    </Container>
  )
}
