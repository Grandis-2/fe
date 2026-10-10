import { useState } from 'react'

import { useCreateReview, useUpdateReview, type Review } from '@entities/review'
import { getErrorMessage } from '@shared/api/client'
import { showToast } from '@shared/model/toastStore'
import { ActionButton, Button, Modal, ModalTitle, Textarea } from '@shared/ui'

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
  open: boolean
  /** 닫히는 애니메이션 동안에도 내용이 보이도록 닫힌 뒤에도 마지막 값을 넘겨 둔다. */
  target: ReviewTarget | null
  onClose: () => void
}

// 이미 쓴 리뷰가 있으면 채워서 수정, 없으면 빈 칸으로 새로 쓴다.
// 모달 껍데기(Modal)를 여기서 그린다 — 전역 모달(RootLayout)은 어두운 페이지 밖이라 밝게 뜬다.
export function ReviewFormModal({
  open,
  target,
  onClose,
}: ReviewFormModalProps) {
  const create = useCreateReview()
  const update = useUpdateReview()
  const saved = target?.review
  const isPending = create.isPending || update.isPending
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')

  // 열릴 때마다 저장된 리뷰(없으면 빈 값)로 되돌린다. 렌더 중에 바로 초기화한다 —
  // 이펙트에서 setState하면 react-hooks/set-state-in-effect에 걸린다(AddressFormModal과 같은 방식).
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setRating(saved?.rating ?? 0)
      setText(saved?.body ?? '')
    }
  }

  const valid = rating > 0 && text.trim().length >= MIN_LENGTH

  // 서버가 받아 준 뒤에 닫는다 — 실패하면 모달을 그대로 두고 서버 문구를 보여 준다.
  const handleSubmit = () => {
    if (!target || !valid || isPending) return
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
    <Modal open={open} onClose={onClose}>
      <div className={styles.content}>
        <div className={styles.heading}>
          <ModalTitle className={styles.title}>
            {saved ? '리뷰 수정' : '리뷰 쓰기'}
          </ModalTitle>
          {target && (
            <span className={styles.product}>
              {target.productName} · {target.optionSummary}
            </span>
          )}
        </div>

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

        <div className={styles.actions}>
          <Button variant="subtle" color="cancel" onClick={onClose}>
            취소
          </Button>
          <ActionButton
            size="md"
            disabled={!valid || isPending}
            onClick={handleSubmit}
          >
            {saved ? '수정 완료' : '리뷰 등록하기'}
          </ActionButton>
        </div>
      </div>
    </Modal>
  )
}
