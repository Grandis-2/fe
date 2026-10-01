import type { ReactNode } from 'react'

import * as styles from './FormSection.css'

export type FormSectionProps = {
  title: string
  description?: ReactNode
  children: ReactNode
}

/** 폼 안에서 반복되는 '작은 제목 + 설명 + 내용' 묶음 */
export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className={styles.root}>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
