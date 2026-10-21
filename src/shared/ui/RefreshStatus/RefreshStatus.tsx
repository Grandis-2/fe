import type { ReactNode } from 'react'

import { RefreshCw } from 'lucide-react'

import * as styles from './RefreshStatus.css'

export type RefreshStatusProps = {
  /** 마지막으로 받은 시각(ms). 아직 못 받았으면 0 — TanStack Query의 dataUpdatedAt */
  updatedAt: number
  onRefresh: () => void
  /** 갱신 규칙 안내(예: '10초마다 자동 갱신') */
  note?: string
  /** 새로 고침 버튼 앞에 붙일 조작(예: 갱신 간격 선택) */
  children?: ReactNode
}

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

/**
 * 자동으로 다시 받는 화면의 '마지막 갱신 시각' 줄. 멈춘 값을 최신으로 읽지 않게 언제
 * 받은 값인지 보여주고, 줄 끝의 버튼을 누르면 바로 다시 받는다.
 */
export function RefreshStatus({
  updatedAt,
  onRefresh,
  note,
  children,
}: RefreshStatusProps) {
  return (
    <div className={styles.root}>
      <span>
        마지막 갱신 {updatedAt ? timeFormatter.format(updatedAt) : '—'}
        {note && ` · ${note}`}
      </span>
      {children}
      <button
        type="button"
        className={styles.button}
        onClick={onRefresh}
        aria-label="지금 새로 고침"
        title="지금 새로 고침"
      >
        <RefreshCw className={styles.icon} aria-hidden="true" />
      </button>
    </div>
  )
}
