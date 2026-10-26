import type { ReactNode } from 'react'

import * as styles from './StackedBar.css'

export type StackedBarSegment = {
  key: string
  label: string
  value: number
  /** 범례 줄 아래 설명 */
  caption?: ReactNode
  tone: keyof typeof styles.fill
}

export type StackedBarProps = {
  segments: readonly StackedBarSegment[]
  /** 범례 오른쪽 값의 단위(예: '건') */
  unit?: string
  className?: string
}

/**
 * 전체를 몇 갈래로 나눴는지 — 한 줄 막대와 그 아래 범례. 막대는 그림이라 범례가 같은 내용을
 * 글로 다시 읽어 준다.
 */
export function StackedBar({
  segments,
  unit = '',
  className,
}: StackedBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {/* 막대는 그림일 뿐 — 같은 내용(설명까지)을 범례가 글로 읽어 준다. */}
      <div className={styles.bar} aria-hidden="true">
        {total > 0 &&
          segments.map((segment) => (
            <span
              key={segment.key}
              className={styles.fill[segment.tone]}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ))}
      </div>
      <ul className={styles.legend}>
        {segments.map((segment) => (
          <li key={segment.key} className={styles.item}>
            <span className={styles.swatch[segment.tone]} aria-hidden="true" />
            <span className={styles.text}>
              {segment.label}
              {segment.caption && (
                <span className={styles.caption}>{segment.caption}</span>
              )}
            </span>
            <span className={styles.value}>
              {segment.value.toLocaleString('ko-KR')}
              {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
