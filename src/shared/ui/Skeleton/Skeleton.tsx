import * as styles from './Skeleton.css'

export type SkeletonProps = {
  /** 숫자는 px. 안 주면 부모 폭을 다 쓴다 */
  width?: number | string
  height?: number | string
  /** 주면 height 대신 폭에 맞춘 비율로 높이를 정한다(이미지 카드 등, 예: '3 / 4') */
  aspectRatio?: string
  radius?: number
  /** 기본은 테마를 따른다. data-theme 밖인데 바탕이 어두우면 dark */
  tone?: keyof typeof styles.tone
  className?: string
}

/**
 * 불러오는 동안 자리를 잡아 두는 회색 막대. 눈으로만 보이는 장식이라
 * 스크린리더엔 숨긴다 — 불러오는 중이라는 안내는 감싸는 쪽이 한 번만 한다(PageSkeleton,
 * SkeletonGroup, Table의 loading 참고).
 */
export function Skeleton({
  width = '100%',
  height = 16,
  aspectRatio,
  radius = 6,
  tone = 'theme',
  className,
}: SkeletonProps) {
  return (
    <span
      className={[styles.root, styles.tone[tone], className]
        .filter(Boolean)
        .join(' ')}
      style={{
        width,
        height: aspectRatio ? undefined : height,
        aspectRatio,
        borderRadius: radius,
      }}
      aria-hidden="true"
    />
  )
}
