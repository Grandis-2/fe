import { useState } from 'react'

import { toLocalInputValue } from '@shared/lib/period'
import { Input, ModalActions } from '@shared/ui'

import * as styles from './ReopenCampaignForm.css'

const HOUR = 60 * 60 * 1000

export type ReopenCampaignFormProps = {
  /** 새 마감 시각(ISO) */
  onConfirm: (closesAt: string) => void
  onCancel: () => void
}

/**
 * 다시 열 접수의 새 마감 시각을 받는다. 지금보다 뒤여야 서버가 받아서, 지난 시각이면
 * 확인을 막고 이유를 적는다. 처음엔 한 시간 뒤(정시)로 채워 둔다.
 */
export function ReopenCampaignForm({
  onConfirm,
  onCancel,
}: ReopenCampaignFormProps) {
  // 창을 연 시각 기준으로 막는다 — 서버가 다시 한 번 지금과 비교한다.
  const [openedAt] = useState(() => Date.now())
  const [closesAt, setClosesAt] = useState(() => {
    const next = new Date(openedAt + HOUR)
    next.setMinutes(0, 0, 0)
    return toLocalInputValue(next)
  })
  const time = Date.parse(closesAt)
  const error =
    !closesAt || Number.isNaN(time)
      ? '새 마감 시각을 골라 주세요.'
      : time <= openedAt
        ? '지금보다 뒤로 정해 주세요.'
        : undefined

  return (
    <div className={styles.root}>
      <Input
        label="새 마감 시각"
        variant="stacked"
        type="datetime-local"
        required
        value={closesAt}
        error={error}
        onChange={(event) => setClosesAt(event.target.value)}
      />
      <ModalActions
        confirmLabel="다시 열기"
        confirmDisabled={error !== undefined}
        onConfirm={() => onConfirm(new Date(closesAt).toISOString())}
        onCancel={onCancel}
      />
    </div>
  )
}
