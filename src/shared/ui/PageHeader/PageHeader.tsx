import type { ReactNode } from 'react'

import * as styles from './PageHeader.css'

export type PageHeaderProps = {
  title: string
  /** 제목 바로 옆 — 바꾸기 전에 먼저 읽혀야 할 표시(팀 공용 서버 등) */
  badge?: ReactNode
  description?: ReactNode
  /** 제목 줄 오른쪽 — 마지막 갱신·새로 고침·화면 도구 */
  aside?: ReactNode
}

/**
 * 관리자 화면 맨 위 제목 줄. 왼쪽에 제목과 설명, 같은 줄 오른쪽에 마지막 갱신 같은 도구를
 * 둔다. 좁으면 도구가 아래로 내려간다.
 */
export function PageHeader({
  title,
  badge,
  description,
  aside,
}: PageHeaderProps) {
  return (
    <header className={styles.root}>
      <div className={styles.heading}>
        <div className={styles.titleLine}>
          <h1 className={styles.title}>{title}</h1>
          {badge}
        </div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </header>
  )
}
