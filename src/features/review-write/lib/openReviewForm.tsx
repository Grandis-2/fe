import { closeModal, openModal } from '@shared/model/modalStore'

import {
  ReviewFormModal,
  type ReviewTarget,
} from '../ui/ReviewFormModal/ReviewFormModal'
import * as styles from '../ui/ReviewFormModal/ReviewFormModal.css'

export const openReviewForm = (target: ReviewTarget) =>
  openModal({
    title: target.review ? '리뷰 수정' : '리뷰 쓰기',
    description: (
      <span className={styles.target}>
        {target.productName} · {target.optionSummary}
      </span>
    ),
    children: <ReviewFormModal target={target} onClose={closeModal} />,
  })
