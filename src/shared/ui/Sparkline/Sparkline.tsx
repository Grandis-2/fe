import * as styles from './Sparkline.css'

export type SparklineProps = {
  /** 시간 순 값. 2개보다 적으면 선 대신 빈 칸을 보인다 */
  values: readonly number[]
  /** 스크린리더용 설명(예: '대기 인원 추이') */
  label: string
  /** 빨간 선으로 그린다(경고 상태) */
  danger?: boolean
  className?: string
}

const WIDTH = 100
const HEIGHT = 32

/**
 * 숫자 몇 개의 흐름만 보여주는 작은 선 그래프. 축·눈금 없이 '오르는지 내리는지'만 본다 —
 * 정확한 값은 옆의 숫자로 읽는다. 차트 라이브러리를 들이지 않으려고 SVG로 그린다.
 */
export function Sparkline({
  values,
  label,
  danger = false,
  className,
}: SparklineProps) {
  const rootClass = [styles.root, className].filter(Boolean).join(' ')
  if (values.length < 2) {
    return <div className={rootClass} role="img" aria-label={`${label} 없음`} />
  }

  const min = Math.min(...values)
  // 값이 모두 같으면 가운데 수평선이 되게 범위를 1로 둔다.
  const range = Math.max(...values) - min || 1
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * WIDTH
      const y = HEIGHT - ((value - min) / range) * (HEIGHT - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      className={rootClass}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <polyline
        className={danger ? styles.lineDanger : styles.line}
        points={points}
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
