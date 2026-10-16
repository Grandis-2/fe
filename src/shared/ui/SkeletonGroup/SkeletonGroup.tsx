import type { ReactNode } from 'react'

import { srOnly } from '@shared/config/theme'

export type SkeletonGroupProps = {
  /** 회색 막대(Skeleton)들 — 배치는 className으로 정한다 */
  children: ReactNode
  className?: string
}

/**
 * 스켈레톤 묶음. 막대는 눈으로만 보이는 장식이라 스크린리더엔 이 묶음이 '불러오는 중'을
 * 한 번만 알린다(role="status").
 */
export function SkeletonGroup({ children, className }: SkeletonGroupProps) {
  return (
    <div className={className} role="status" aria-busy="true">
      <span className={srOnly}>불러오는 중입니다.</span>
      {children}
    </div>
  )
}
