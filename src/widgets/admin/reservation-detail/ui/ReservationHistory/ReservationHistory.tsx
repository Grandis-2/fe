import { useState } from 'react'

import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { SegmentedTabs } from '@shared/ui'

import * as styles from './ReservationHistory.css'

import type { HistoryEntry, HistoryKind } from '../../lib/history'

export type ReservationHistoryProps = {
  entries: HistoryEntry[]
}

type Filter = 'all' | HistoryKind

const tabs: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'status', label: '상태 변경' },
  { value: 'sync', label: '외부 연동' },
]

/** 상태 변경과 외부 연동 시도를 한 목록에 — 최근 것이 위, 종류로 거를 수 있다 */
export function ReservationHistory({ entries }: ReservationHistoryProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const visible = entries.filter(
    (entry) => filter === 'all' || entry.kind === filter,
  )

  return (
    <div className={styles.root}>
      <SegmentedTabs items={tabs} value={filter} onChange={setFilter} />
      {visible.length === 0 ? (
        <div className={styles.empty}>이력이 없습니다.</div>
      ) : (
        <ol className={styles.list}>
          {visible.map((entry) => (
            <li key={entry.key} className={styles.item}>
              <span className={styles.time}>{formatDotDateTime(entry.at)}</span>
              <div className={styles.body}>
                <span className={styles.title}>{entry.title}</span>
                <span className={styles.actor}>{entry.actor}</span>
                {entry.error && (
                  <span className={styles.error}>{entry.error}</span>
                )}
                {entry.note && (
                  <span className={styles.note}>{entry.note}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
