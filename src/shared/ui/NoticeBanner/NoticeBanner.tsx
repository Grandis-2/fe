import type { ReactNode } from 'react'

import * as styles from './NoticeBanner.css'

export type NoticeBannerProps = {
  tone: keyof typeof styles.tone
  title: string
  description?: string
  /** 띠 오른쪽의 조치 버튼 */
  action?: ReactNode
  /** 띠 아래에 붙일 내용(예: 반영되지 않은 처리 목록) */
  children?: ReactNode
}

/**
 * 관리자 상세 화면 맨 위의 "지금 할 일" 띠(예약·럭키드로우 회차). 문제가 있을 때만 나와서,
 * 띠가 보이면 무언가 있다는 뜻이다. 무엇이 막혔는지와 조치를 한 자리에 둔다.
 * danger는 지금 눌러야 하는 것, warning은 알아 둘 것, info는 상황 설명.
 */
export function NoticeBanner({
  tone,
  title,
  description,
  action,
  children,
}: NoticeBannerProps) {
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
