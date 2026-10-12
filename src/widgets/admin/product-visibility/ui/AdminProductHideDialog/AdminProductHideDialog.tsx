import { useState } from 'react'

import {
  HIDE_REASON_MAX_LENGTH,
  HIDE_REASON_MIN_LENGTH,
} from '@entities/admin-product'
import { InlineAlert, Input, ModalActions } from '@shared/ui'

export type AdminProductHideDialogProps = {
  onConfirm: (reason: string) => void
  onCancel: () => void
}

/**
 * 상품을 숨길 때 사유를 받는 모달 내용. 제목·안내 문구는 여는 쪽이 Modal에 넘긴다.
 *
 * 사유를 따로 받는 건 서버가 요구해서만이 아니다 — 구매자에게 보이던 상품이 사라지는
 * 일이라, 왜 내렸는지가 남아야 나중에 되돌릴지 판단할 수 있다.
 *
 * 입력 상태와 버튼을 이 컴포넌트가 직접 들고 있다. 전역 모달은 연 시점의 props를
 * 그대로 들고 있어서, 여는 쪽이 상태를 쥐면 글자를 쳐도 다시 그려지지 않는다.
 */
export function AdminProductHideDialog({
  onConfirm,
  onCancel,
}: AdminProductHideDialogProps) {
  const [reason, setReason] = useState('')
  // 처음부터 빨갛게 띄우지 않는다 — 한 번이라도 제출을 눌러 본 뒤에만 알린다.
  const [submitted, setSubmitted] = useState(false)

  const trimmed = reason.trim()
  const tooShort = trimmed.length < HIDE_REASON_MIN_LENGTH

  const submit = () => {
    setSubmitted(true)
    if (tooShort) return
    onConfirm(trimmed)
  }

  return (
    <>
      <Input
        label="숨김 사유"
        maxLength={HIDE_REASON_MAX_LENGTH}
        aria-invalid={submitted && tooShort}
        value={reason}
        size="small"
        onChange={(event) => setReason(event.target.value)}
      />

      {submitted && tooShort && (
        <InlineAlert status="error">
          사유를 {HIDE_REASON_MIN_LENGTH}자 이상 적어주세요.
        </InlineAlert>
      )}

      <ModalActions
        confirmLabel="숨기기"
        onConfirm={submit}
        onCancel={onCancel}
      />
    </>
  )
}
