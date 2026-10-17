import { useState } from 'react'

import { Input, ModalActions } from '@shared/ui'

import * as styles from './NumberSettingForm.css'

export type NumberSettingFormProps = {
  label: string
  /** 숫자 뒤에 붙는 단위(예: '명/초', '초') */
  unit: string
  min: number
  max: number
  /** 처음 칸에 채울 값(지금 적용 중인 값) */
  initial: number | null
  /** 바꾸면 무슨 일이 생기는지 — 실제 회원에게 바로 반영되는 값이라 꼭 알린다 */
  hint?: string
  onConfirm: (value: number) => void
  onCancel: () => void
}

/**
 * 운영값 하나를 정수로 받는 모달 내용. 범위를 벗어나면 확인을 막아 서버 400을 미리 피한다.
 * 확인 버튼이 입력값에 따라 막혀야 해서 버튼 줄(ModalActions)을 여기서 그린다.
 */
export function NumberSettingForm({
  label,
  unit,
  min,
  max,
  initial,
  hint,
  onConfirm,
  onCancel,
}: NumberSettingFormProps) {
  const [text, setText] = useState(initial === null ? '' : String(initial))
  const value = Number(text)
  const valid =
    text.trim() !== '' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max

  return (
    <div className={styles.root}>
      <Input
        label={`${label}(${unit})`}
        variant="stacked"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={text}
        onChange={(event) => setText(event.target.value)}
        error={
          text.trim() !== '' && !valid
            ? `${min.toLocaleString('ko-KR')}~${max.toLocaleString('ko-KR')} 사이의 정수로 적어 주세요.`
            : undefined
        }
      />
      <div className={styles.hint}>
        {min.toLocaleString('ko-KR')}~{max.toLocaleString('ko-KR')}
        {unit}
        {hint && ` · ${hint}`}
      </div>
      <ModalActions
        confirmLabel="변경"
        confirmDisabled={!valid}
        onConfirm={() => onConfirm(value)}
        onCancel={onCancel}
      />
    </div>
  )
}
