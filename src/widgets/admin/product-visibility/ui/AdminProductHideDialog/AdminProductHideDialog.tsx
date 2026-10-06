import { useState } from 'react'

import {
  HIDE_REASON_MAX_LENGTH,
  HIDE_REASON_MIN_LENGTH,
} from '@entities/admin-product'
import { Button, InlineAlert, Input, ModalTitle } from '@shared/ui'

import * as styles from './AdminProductHideDialog.css'

export type AdminProductHideDialogProps = {
  productName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}

/**
 * 상품을 숨길 때 사유를 받는 모달 내용.
 *
 * 사유를 따로 받는 건 서버가 요구해서만이 아니다 — 구매자에게 보이던 상품이 사라지는
 * 일이라, 왜 내렸는지가 남아야 나중에 되돌릴지 판단할 수 있다.
 *
 * 입력 상태를 이 컴포넌트가 직접 들고 있다. 모달은 useModalStore가 ReactNode를
 * 스냅샷으로 들고 띄우는 구조라, 여는 쪽이 상태를 쥐면 글자를 쳐도 다시 그려지지 않는다.
 */
export function AdminProductHideDialog({
  productName,
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
    <div className={styles.content}>
      <ModalTitle className={styles.title}>상품을 숨길까요?</ModalTitle>
      <div className={styles.description}>
        {productName}이(가) 구매자 화면에서 사라집니다.
        <br />
        다시 공개할 수 있습니다.
      </div>

      <div className={styles.field}>
        <Input
          label="숨김 사유"
          maxLength={HIDE_REASON_MAX_LENGTH}
          invalid={submitted && tooShort}
          value={reason}
          size="small"
          onChange={(event) => setReason(event.target.value)}
        />
      </div>

      {submitted && tooShort && (
        <InlineAlert status="error">
          사유를 {HIDE_REASON_MIN_LENGTH}자 이상 적어주세요.
        </InlineAlert>
      )}

      <div className={styles.actions}>
        <Button onClick={submit}>숨기기</Button>
        <Button
          variant="outline"
          color="cancel"

          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  )
}
