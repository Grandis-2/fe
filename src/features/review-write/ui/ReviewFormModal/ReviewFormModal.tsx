import { useState } from 'react'

import { useCreateReview, useUpdateReview, type Review } from '@entities/review'
import { getErrorMessage } from '@shared/api/client'
import { showToast } from '@shared/model/toastStore'
import { ModalActions, Textarea } from '@shared/ui'

import * as styles from './ReviewFormModal.css'

const MAX_LENGTH = 500
const MIN_LENGTH = 10
const RATINGS = [1, 2, 3, 4, 5]

// 어느 주문상품의 리뷰인지. 이미 쓴 리뷰가 있으면 review로 넘겨 수정한다.
export type ReviewTarget = {
  orderItemId: string
  productName: string
  optionSummary: string
  review?: Pick<Review, 'reviewId' | 'rating' | 'body'>
}

export type ReviewFormModalProps = {
  target: ReviewTarget
  onClose: () => void
}

// 리뷰 모달의 내용 — openReviewForm()이 제목과 함께 Modal에 넣는다.
// 이미 쓴 리뷰가 있으면 채워서 수정, 없으면 빈 칸으로 새로 쓴다. 열 때마다 새로
// 마운트되므로(전역 모달이 key를 바꾼다) 초기값은 처음 렌더에서만 읽으면 된다.
// 등록 버튼이 입력값에 따라 막히므로 버튼(ModalActions)도 여기서 그린다.
export function ReviewFormModal({ target, onClose }: ReviewFormModalProps) {
  const create = useCreateReview()
  const update = useUpdateReview()
  const saved = target.review
  const isPending = create.isPending || update.isPending
  const [rating, setRating] = useState(saved?.rating ?? 0)
  const [text, setText] = useState(saved?.body ?? '')

  const valid = rating > 0 && text.trim().length >= MIN_LENGTH

  // 서버가 받아 준 뒤에 닫는다 — 실패하면 모달을 그대로 두고 서버 문구를 보여 준다.
  const handleSubmit = () => {
    if (!valid || isPending) return
    const body = text.trim()
    const options = {
      onSuccess: () => {
        showToast(saved ? '리뷰를 수정했어요.' : '리뷰가 등록되었어요.')
        onClose()
      },
      onError: (caught: unknown) =>
        showToast(getErrorMessage(caught, '리뷰를 저장하지 못했어요.')),
    }
    if (saved)
      update.mutate({ reviewId: saved.reviewId, rating, body }, options)
    else
      create.mutate({ orderItemId: target.orderItemId, rating, body }, options)
  }

  return (
    <div className={styles.content}>
      <div className={styles.rating} role="group" aria-label="별점">
        {RATINGS.map((value) => (
          <button
            key={value}
            type="button"
            className={styles.star[value <= rating ? 'filled' : 'empty']}
            aria-label={`${value}점`}
            aria-pressed={value === rating}
            onClick={() => setRating(value)}
          >
            ★
          </button>
        ))}
        <span className={styles.score}>
          {rating ? `${rating}.0` : '별점을 선택해 주세요'}
        </span>
      </div>

      <div className={styles.textField}>
        <Textarea
          label="리뷰 내용"
          rows={5}
          className={styles.textarea}
          value={text}
          maxLength={MAX_LENGTH}
          placeholder={`사용해 보니 어땠나요? ${MIN_LENGTH}자 이상 입력해 주세요.`}
          onChange={(event) => setText(event.target.value)}
        />
        <span className={styles.counter}>
          {text.length} / {MAX_LENGTH}
        </span>
      </div>

      <ModalActions
        confirmLabel={saved ? '수정 완료' : '리뷰 등록하기'}
        confirmDisabled={!valid || isPending}
        onConfirm={handleSubmit}
        onCancel={onClose}
      />
    </div>
  )
}
