import type { ReactNode } from 'react'

import * as styles from './CountBadge.css'

export type CountBadgeProps = {
  /** 건수. 스크린리더용 설명(srOnly)을 함께 넣어도 된다 */
  children: ReactNode
  className?: string
}

/** 손볼 일이 있다는 빨간 건수 배지 — 한 자리면 원, 두 자리부터 알약 */
export function CountBadge({ children, className }: CountBadgeProps) {
  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
