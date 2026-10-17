import { useState, type PointerEvent } from 'react'

import { srOnly } from '@shared/config/theme'

import * as styles from './ThroughputChart.css'

export type ThroughputSeries = {
  label: string
  /** times와 같은 길이 */
  values: readonly number[]
}

export type ThroughputChartProps = {
  /** 표본 시각(ms), 시간 순 */
  times: readonly number[]
  /** 두 줄 — 첫째가 들어오는 양, 둘째가 처리한 양. 같은 단위라 축 하나로 그린다 */
  series: readonly [ThroughputSeries, ThroughputSeries]
  unit: string
  /** 스크린리더용 제목 */
  label: string
}

const WIDTH = 600
const HEIGHT = 200
const PAD_TOP = 8
/** 표로 읽어 줄 최근 표본 수 — 전부 읽으면 너무 길다 */
const TABLE_ROWS = 12

const seriesClass = [styles.series1, styles.series2] as const
const swatchClass = [styles.swatch1, styles.swatch2] as const

/** 1·2·5 단위로 올린 눈금 최댓값 — 축 숫자가 읽기 쉬운 값이 되게 */
function niceMax(value: number) {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 5, 10].find((n) => n * power >= value) ?? 10
  return step * power
}

const formatTime = (ms: number) =>
  new Date(ms).toLocaleTimeString('ko-KR', { hour12: false })

const formatValue = (value: number, unit: string) =>
  `${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}${unit}`

/**
 * 들어오는 양과 처리한 양을 한 축에 겹쳐 그린다. 두 선 사이가 벌어지면 그만큼 적체가
 * 쌓이는 것이다. 차트 라이브러리를 들이지 않으려고 SVG로 그리고, 글자는 늘어나지 않게
 * HTML로 겹친다.
 */
export function ThroughputChart({
  times,
  series,
  unit,
  label,
}: ThroughputChartProps) {
  const [hover, setHover] = useState<number | null>(null)

  if (times.length < 2) {
    return (
      <div className={styles.empty}>
        표본이 두 개 이상 모이면 그래프를 그립니다.
      </div>
    )
  }

  const max = niceMax(Math.max(...series.flatMap((it) => it.values)))
  const xOf = (index: number) => (index / (times.length - 1)) * WIDTH
  const yOf = (value: number) => HEIGHT - (value / max) * (HEIGHT - PAD_TOP)
  const pathOf = (values: readonly number[]) =>
    values
      .map(
        (value, index) => `${xOf(index).toFixed(1)},${yOf(value).toFixed(1)}`,
      )
      .join(' ')

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - box.left) / box.width
    setHover(Math.round(Math.min(1, Math.max(0, ratio)) * (times.length - 1)))
  }

  const last = times.length - 1
  const shown = hover ?? last
  const hoverLeft = `${(shown / last) * 100}%`

  return (
    <figure className={styles.root}>
      <ul className={styles.legend}>
        {series.map((item, index) => (
          <li key={item.label} className={styles.legendItem}>
            <span className={swatchClass[index]} aria-hidden="true" />
            {item.label}
            <span className={styles.legendValue}>
              {formatValue(item.values[last], unit)}
            </span>
          </li>
        ))}
      </ul>

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
          aria-label={`${label}. ${series
            .map(
              (item) => `${item.label} ${formatValue(item.values[last], unit)}`,
            )
            .join(', ')}`}
        >
          <svg
            className={styles.svg}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
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
            {series.map((item, index) => (
              <polyline
                key={item.label}
                className={seriesClass[index]}
                points={pathOf(item.values)}
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {hover !== null && (
            <>
              <span className={styles.crosshair} style={{ left: hoverLeft }} />
              <div
                role="tooltip"
                className={
                  shown > last / 2 ? styles.tooltipLeft : styles.tooltipRight
                }
                style={{ left: hoverLeft }}
              >
                <div className={styles.tooltipTime}>
                  {formatTime(times[shown])}
                </div>
                {series.map((item, index) => (
                  <div key={item.label} className={styles.tooltipRow}>
                    <span className={swatchClass[index]} aria-hidden="true" />
                    {item.label}
                    <span className={styles.legendValue}>
                      {formatValue(item.values[shown], unit)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.xAxis} aria-hidden="true">
        <span>{formatTime(times[0])}</span>
        <span>{formatTime(times[last])}</span>
      </div>

      <table className={srOnly}>
        <caption>
          {label} (최근 {TABLE_ROWS}개 표본)
        </caption>
        <thead>
          <tr>
            <th scope="col">시각</th>
            {series.map((item) => (
              <th key={item.label} scope="col">
                {item.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.slice(-TABLE_ROWS).map((time, offset) => {
            const index =
              times.length - Math.min(TABLE_ROWS, times.length) + offset
            return (
              <tr key={time}>
                <td>{formatTime(time)}</td>
                {series.map((item) => (
                  <td key={item.label}>
                    {formatValue(item.values[index], unit)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </figure>
  )
}
