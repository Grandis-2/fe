import { closeModal, openModal } from '@shared/model/modalStore'

import {
  ReviewFormModal,
  type ReviewTarget,
} from '../ui/ReviewFormModal/ReviewFormModal'

export const openReviewForm = (target: ReviewTarget) =>
  openModal({
    title: target.review ? '리뷰 수정' : '리뷰 쓰기',
    description: `${target.productName} · ${target.optionSummary}`,
    children: <ReviewFormModal target={target} onClose={closeModal} />,
  })
