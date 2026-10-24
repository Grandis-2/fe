import { Fragment, type ReactNode } from 'react'

import * as styles from './DescriptionList.css'

export type DescriptionItem = { label: string; value: ReactNode }

export type DescriptionListProps = {
  items: DescriptionItem[]
  className?: string
}

/** 라벨 · 값 두 열 목록(상세 화면의 정보 칸). 값이 길면 줄을 바꾼다 */
export function DescriptionList({ items, className }: DescriptionListProps) {
  return (
    <dl className={[styles.root, className].filter(Boolean).join(' ')}>
      {items.map(({ label, value }) => (
        <Fragment key={label}>
          <dt className={styles.term}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </Fragment>
      ))}
    </dl>
  )
}
