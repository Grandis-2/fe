import type { ReactNode } from 'react'

import * as styles from './ReservationNotice.css'

export type ReservationNoticeProps = {
  tone: keyof typeof styles.tone
  title: string
  description?: string
  /** 띠 오른쪽의 조치 버튼 */
  action?: ReactNode
  /** 띠 아래에 붙일 내용(예: 반영되지 않은 처리 목록) */
  children?: ReactNode
}

/**
 * 예약 상세 맨 위의 "지금 할 일" 띠. 문제가 있을 때만 나와서, 띠가 보이면 무언가 있다는
 * 뜻이다. 무엇이 막혔는지와 조치를 한 자리에 둔다.
 */
export function ReservationNotice({
  tone,
  title,
  description,
  action,
  children,
}: ReservationNoticeProps) {
  return (
    <section
      className={styles.tone[tone]}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div className={styles.head}>
        <div className={styles.text}>
          <span className={styles.title}>{title}</span>
          {description && (
            <span className={styles.description}>{description}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
