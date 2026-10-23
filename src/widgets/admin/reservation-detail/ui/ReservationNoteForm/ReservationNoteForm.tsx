import { useState } from 'react'

import { Button, Textarea } from '@shared/ui'

import * as styles from './ReservationNoteForm.css'

export type ReservationNoteFormProps = {
  /** 서버에 저장된 메모. 없으면 null */
  value: string | null
  maxLength: number
  saving?: boolean
  /** 앞뒤 공백을 뺀 값. 비우면 null(메모 지우기) */
  onSave: (note: string | null) => void
}

/**
 * 회원에게 보이지 않는 관리자 메모. 저장한 값과 같으면 저장 버튼을 막는다 — 저장 뒤
 * 상세가 새 값으로 바뀌면 입력칸도 그 값으로 다시 맞춘다(key로 다시 그림).
 */
export function ReservationNoteForm({
  value,
  maxLength,
  saving = false,
  onSave,
}: ReservationNoteFormProps) {
  const [draft, setDraft] = useState(value ?? '')
  const next = draft.trim() || null

  return (
    <div className={styles.root}>
      <Textarea
        label="내부 메모"
        rows={3}
        maxLength={maxLength}
        placeholder="예: 고객 요청으로 배송지 변경 문의 — 콜센터 #20261008-17"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className={styles.footer}>
        <Button
          size="small"
          disabled={saving || next === value}
          onClick={() => onSave(next)}
        >
          {saving ? '저장 중…' : '메모 저장'}
        </Button>
      </div>
    </div>
  )
}
