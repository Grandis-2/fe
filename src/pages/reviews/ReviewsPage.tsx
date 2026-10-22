import { Container } from '@shared/ui'
import { ReviewList } from '@widgets/review-list'

import * as styles from './ReviewsPage.css'

export function ReviewsPage() {
  return (
    <Container>
      <div className={styles.title}>구매후기</div>
      <ReviewList />
    </Container>
  )
}
