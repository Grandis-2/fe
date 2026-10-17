import * as styles from './Skeleton.css'

export type SkeletonProps = {
  /** 숫자는 px. 안 주면 부모 폭을 다 쓴다 */
  width?: number | string
  height?: number | string
  radius?: number
  className?: string
}

/**
 * 불러오는 동안 자리를 잡아 두는 회색 막대(밝은 바탕용). 눈으로만 보이는 장식이라
 * 스크린리더엔 숨긴다 — 불러오는 중이라는 안내는 감싸는 쪽이 한 번만 한다(PageSkeleton,
 * Table의 loading 참고).
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 6,
  className,
}: SkeletonProps) {
  return (
    <span
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}
