import { useId, type ReactNode } from 'react'

import * as styles from './Panel.css'

export type PanelProps = {
  title: ReactNode
  /** 제목 줄 오른쪽 — 짧은 안내나 작은 버튼 */
  aside?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * 제목이 안에 들어간 흰 카드(관리자 상세 화면의 한 덩어리). 제목이 영역 이름이 되도록
 * aria-labelledby로 잇는다.
 */
export function Panel({ title, aside, children, className }: PanelProps) {
  const titleId = useId()
  return (
    <section
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {aside && <div className={styles.aside}>{aside}</div>}
      </div>
      {children}
    </section>
  )
}
