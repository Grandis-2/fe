import { useId, useState, type PointerEvent } from 'react'

import { srOnly } from '@shared/config/theme'
import { monotonePath } from '@shared/lib/monotonePath'
import { niceMax } from '@shared/lib/niceMax'

import { Skeleton } from '../Skeleton'

import * as styles from './TrendChart.css'

export type TrendChartTone = 'primary' | 'warning'

/** 강조할 구간(ms) — 빗금 띠로 깔고 왼쪽 위에 이름을 붙인다 */
export type TrendChartBand = { from: number; to: number; label: string }

export type TrendChartProps = {
  /** 표본 시각(ms), 시간 순 */
  times: readonly number[]
  /** times와 같은 길이 */
  values: readonly number[]
  /** 값 뒤에 붙는 단위 — '건' */
  unit: string
  /** 스크린리더용 제목 */
  label: string
  /** 선 색 — 나빠지는 중이면 warning */
  tone?: TrendChartTone
  /** 기준선(상한 등) — 점선으로 긋고 오른쪽 위에 이름을 붙인다 */
  reference?: { value: number; label: string }
  /** 강조할 구간(브레이크가 걸린 동안 등) */
  bands?: readonly TrendChartBand[]
}

const WIDTH = 600
const HEIGHT = 180
const PAD_TOP = 10
// 축 최댓값의 하한 — 값이 모두 0이면 축이 1·1·0(0.5 반올림)으로 찍히고, 0과 1을 오가는 값이
// 그래프 꼭대기까지 치솟아 보인다.
const MIN_SCALE = 10

const formatTime = (ms: number) =>
  new Date(ms).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const formatValue = (value: number, unit: string) =>
  `${Math.round(value).toLocaleString('ko-KR')}${unit}`

/**
 * 값 하나가 시간에 따라 어떻게 변하는지 — 부드러운 곡선과 아래로 옅어지는 면으로 그린다.
 * 마지막 점에 지금 값을 찍고, 올리면 그 시각의 값을 보인다. 처음 나타날 때 선이 그려진다.
 * 표본이 둘 미만이면 같은 높이의 회색 막대로 자리를 잡는다.
 */
export function TrendChart({
  times,
  values,
  unit,
  label,
  tone = 'primary',
  reference,
  bands = [],
}: TrendChartProps) {
  const gradientId = useId()
  const [hover, setHover] = useState<number | null>(null)

  if (times.length < 2) {
    return (
      <figure className={styles.root} aria-busy="true">
        <div className={styles.plotRow} aria-hidden="true">
          <div className={styles.yAxis} />
          <div className={styles.placeholder}>
            <Skeleton height="100%" radius={8} />
          </div>
        </div>
        <div className={styles.xAxis} aria-hidden="true">
          <span>&nbsp;</span>
        </div>
        <span className={srOnly}>
          표본이 두 개 이상 모이면 그래프를 그립니다.
        </span>
      </figure>
    )
  }

  const first = times[0]
  const span = times[times.length - 1] - first || 1
  const max = niceMax(Math.max(...values, reference?.value ?? 0, MIN_SCALE))
  const xOf = (at: number) => ((at - first) / span) * WIDTH
  const yOf = (value: number) => HEIGHT - (value / max) * (HEIGHT - PAD_TOP)
  const points = times.map((at, i) => ({ x: xOf(at), y: yOf(values[i]) }))
  const line = monotonePath(points)
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`

  const last = times.length - 1
  const shown = hover ?? last
  // 점·세로선·툴팁은 글자처럼 찌그러지지 않게 HTML로 겹친다(그림은 가로로 늘어난다).
  const leftOf = (i: number) => `${(points[i].x / WIDTH) * 100}%`
  const topOf = (i: number) => `${(points[i].y / HEIGHT) * 100}%`
  // 띠는 그리는 구간 안으로 자른다(앞부분이 표본 밖에서 시작했을 수 있다).
  const percentOf = (at: number) =>
    Math.min(100, Math.max(0, ((at - first) / span) * 100))

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const at = first + ((event.clientX - box.left) / box.width) * span
    let best = 0
    times.forEach((time, i) => {
      if (Math.abs(time - at) < Math.abs(times[best] - at)) best = i
    })
    setHover(best)
  }

  return (
    <figure className={styles.root}>
      <div className={styles.plotRow}>
        <div className={styles.yAxis} aria-hidden="true">
          <span>{formatValue(max, unit)}</span>
          <span>{formatValue(max / 2, unit)}</span>
          <span>0</span>
        </div>

        <div
          className={styles.plot}
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={[
            `${label}. 지금 ${formatValue(values[last], unit)}`,
            reference?.label,
            ...bands.map(
              (band) => `${formatTime(band.from)}부터 ${band.label}`,
            ),
          ]
            .filter(Boolean)
            .join(', ')}
        >
          <svg
            className={styles.svg}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" className={styles.stopTop[tone]} />
                <stop offset="1" className={styles.stopBottom[tone]} />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((ratio) => (
              <line
                key={ratio}
                className={ratio === 0 ? styles.baseline : styles.grid}
                x1={0}
                x2={WIDTH}
                y1={yOf(max * ratio)}
                y2={yOf(max * ratio)}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {reference && (
              <line
                className={styles.reference}
                x1={0}
                x2={WIDTH}
                y1={yOf(reference.value)}
                y2={yOf(reference.value)}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {/* 면과 선을 묶어 처음 나타날 때 왼쪽부터 함께 펼친다. */}
            <g className={styles.marks}>
              <path d={area} fill={`url(#${gradientId})`} />
              <path
                className={styles.line[tone]}
                d={line}
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>

          {bands.map((band) => {
            const left = percentOf(band.from)
            const right = percentOf(band.to)
            if (right <= left) return null
            return (
              <span
                key={band.from}
                className={styles.band}
                style={{ left: `${left}%`, width: `${right - left}%` }}
                aria-hidden="true"
              >
                <span className={styles.bandLabel}>{band.label}</span>
              </span>
            )
          })}
          {reference && (
            <span
              className={styles.referenceLabel}
              style={{ top: `${(yOf(reference.value) / HEIGHT) * 100}%` }}
              aria-hidden="true"
            >
              {reference.label}
            </span>
          )}
          {hover !== null && (
            <span
              className={styles.crosshair}
              style={{ left: leftOf(shown) }}
            />
          )}
          <span
            className={styles.dot[tone]}
            style={{ left: leftOf(shown), top: topOf(shown) }}
          />
          {hover !== null && (
            <div
              role="tooltip"
              className={
                points[shown].x > WIDTH / 2
                  ? styles.tooltipLeft
                  : styles.tooltipRight
              }
              style={{ left: leftOf(shown) }}
            >
              <span className={styles.tooltipTime}>
                {formatTime(times[shown])}
              </span>
              <b>{formatValue(values[shown], unit)}</b>
            </div>
          )}
        </div>
      </div>

      <div className={styles.xAxis} aria-hidden="true">
        <span>{formatTime(first)}</span>
        <span>{formatTime(first + span / 2)}</span>
        <span>지금</span>
      </div>
    </figure>
  )
}
