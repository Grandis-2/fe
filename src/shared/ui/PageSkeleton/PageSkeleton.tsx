import { Skeleton, type SkeletonProps } from '../Skeleton'
import { SkeletonGroup } from '../SkeletonGroup'

import * as styles from './PageSkeleton.css'

export type PageSkeletonProps = {
  /** 맨 위 제목 줄(제목 + 상태 태그 자리). 폼만 그릴 땐 끈다 */
  title?: boolean
  /** 섹션(제목 + 칸) 수 */
  sections?: number
  /** 섹션마다 입력·내용 칸 수 */
  fieldsPerSection?: number
  tone?: SkeletonProps['tone']
  className?: string
}

/**
 * 상세 화면·폼을 불러오는 동안의 자리. '불러오는 중입니다.' 글자 대신 모양을 먼저 깔아
 * 다 왔을 때 화면이 덜 튄다.
 */
export function PageSkeleton({
  title = true,
  sections = 2,
  fieldsPerSection = 2,
  tone,
  className,
}: PageSkeletonProps) {
  return (
    <SkeletonGroup
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      {title && (
        <div className={styles.titleRow}>
          <Skeleton tone={tone} width={240} height={30} radius={8} />
          <Skeleton tone={tone} width={64} height={26} />
          <Skeleton tone={tone} width={64} height={26} />
        </div>
      )}
      {Array.from({ length: sections }, (_, section) => (
        <div key={section} className={styles.section}>
          <Skeleton tone={tone} width={120} height={20} />
          {Array.from({ length: fieldsPerSection }, (_, field) => (
            <Skeleton tone={tone} key={field} height={52} radius={12} />
          ))}
        </div>
      ))}
    </SkeletonGroup>
  )
}
