import type { ReactNode } from 'react'

import * as styles from './FormSection.css'

export type FormSectionProps = {
  title: string
  /** 제목 옆에 붙는 짧은 표시(잠김·바뀜 등) */
  badge?: ReactNode
  description?: ReactNode
  children: ReactNode
  /** 목차에서 이 섹션으로 건너올 때 쓰는 앵커 */
  id?: string
}

/** 폼 안에서 반복되는 '작은 제목 + 설명 + 내용' 묶음 */
export function FormSection({
  title,
  badge,
  description,
  children,
  id,
}: FormSectionProps) {
  return (
    <section id={id} className={styles.root}>
      <div className={styles.title}>
        {title}
        {badge}
      </div>
      {description && <div className={styles.description}>{description}</div>}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
