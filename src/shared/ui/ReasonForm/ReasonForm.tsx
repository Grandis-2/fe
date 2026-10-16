import { useState } from 'react'

import { ModalActions } from '../Modal'
import { Textarea } from '../Textarea'

import * as styles from './ReasonForm.css'

export type ReasonFormProps = {
  /** 입력칸 이름. 위에 '(필수)'를 붙여 보여준다 */
  label: string
  placeholder?: string
  /** 처음 채워 둘 문구 — 정해진 말로 충분한 조치는 확인만 눌러도 되게 한다 */
  defaultValue?: string
  /** 앞뒤 공백을 뺀 최소 글자 수. 서버 규칙에 맞춘다 */
  minLength?: number
  maxLength: number
  confirmLabel: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}

/**
 * 되돌릴 수 없는 조치의 사유를 받는다. 전역 모달의 내용으로 들어간다 — 확인 버튼이
 * 입력값에 따라 막혀야 해서 버튼 줄(ModalActions)을 여기서 직접 그린다.
 */
export function ReasonForm({
  label,
  placeholder,
  defaultValue = '',
  minLength = 1,
  maxLength,
  confirmLabel,
  onConfirm,
  onCancel,
}: ReasonFormProps) {
  const [reason, setReason] = useState(defaultValue)
  // 서버는 앞뒤 공백을 뺀 길이를 본다.
  const trimmed = reason.trim()

  return (
    <div className={styles.root}>
      <div className={styles.label}>{label} (필수)</div>
      <Textarea
        label={label}
        rows={4}
        maxLength={maxLength}
        placeholder={placeholder}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className={styles.count}>
        {minLength > 1 && trimmed.length < minLength
          ? `${minLength}자 이상 · `
          : ''}
        {trimmed.length}/{maxLength}
      </div>
      <ModalActions
        confirmLabel={confirmLabel}
        confirmDisabled={trimmed.length < minLength}
        onConfirm={() => onConfirm(trimmed)}
        onCancel={onCancel}
      />
    </div>
  )
}
