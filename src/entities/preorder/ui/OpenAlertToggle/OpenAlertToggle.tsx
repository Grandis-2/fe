import { BellOff, BellRing } from 'lucide-react'

import * as styles from './OpenAlertToggle.css'

export type OpenAlertToggleProps = {
  subscribed: boolean
  /** 무엇의 알림인지 — '아이폰 18 Pro 오픈 알림'처럼 읽힌다. */
  name: string
  onToggle: () => void
}

// 오픈 알림 켜고 끄기 — 테두리 없이 종만 보인다. 켜짐/꺼짐은 aria-pressed가 알려 주므로 이름은 고정한다.
export function OpenAlertToggle({
  subscribed,
  name,
  onToggle,
}: OpenAlertToggleProps) {
  return (
    <button
      type="button"
      className={styles.root}
      aria-pressed={subscribed}
      aria-label={`${name} 오픈 알림`}
      title={subscribed ? '알림 받는 중' : '알림 받기'}
      onClick={onToggle}
    >
      {subscribed ? (
        <BellRing size={22} aria-hidden="true" />
      ) : (
        <BellOff size={22} aria-hidden="true" />
      )}
    </button>
  )
}
