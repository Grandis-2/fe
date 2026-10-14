import { useState } from 'react'

import { CANCEL_REASON_MAX } from '@entities/admin-product'
import { ModalActions, Textarea } from '@shared/ui'

import * as styles from './CancelReasonForm.css'

export type CancelReasonFormProps = {
  onConfirm: (reason: string) => void
  onCancel: () => void
}

/**
 * 사전예약 오픈 뒤 판매 중지(회차 취소) 사유. 전역 모달의 내용으로 들어간다 — 확인
 * 버튼이 입력값에 따라 막혀야 해서 버튼 줄(ModalActions)을 여기서 직접 그린다.
 */
export function CancelReasonForm({
  onConfirm,
  onCancel,
}: CancelReasonFormProps) {
  const [reason, setReason] = useState('')
  // 서버는 앞뒤 공백을 뺀 길이로 1~500자를 본다.
  const trimmed = reason.trim()

  return (
    <div className={styles.root}>
      <div className={styles.label}>중지 사유 (필수)</div>
      <Textarea
        label="중지 사유"
        rows={4}
        maxLength={CANCEL_REASON_MAX}
        placeholder="예: 제조사 출시 일정 연기로 이번 회차를 취소합니다."
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className={styles.count}>
        {trimmed.length}/{CANCEL_REASON_MAX}
      </div>
      <ModalActions
        confirmLabel="판매 중지"
        confirmDisabled={trimmed.length === 0}
        onConfirm={() => onConfirm(trimmed)}
        onCancel={onCancel}
      />
    </div>
  )
}
