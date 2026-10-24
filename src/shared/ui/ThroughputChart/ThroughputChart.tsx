import { useState, type PointerEvent } from 'react'

import { srOnly } from '@shared/config/theme'
import { niceMax } from '@shared/lib/niceMax'

import { Skeleton } from '../Skeleton'

import * as styles from './ThroughputChart.css'

export type ThroughputSeries = {
  label: string
  /** times와 같은 길이 */
  values: readonly number[]
}

export type ThroughputChartProps = {
  /** 표본 시각(ms), 시간 순 */
  times: readonly number[]
  /**
   * 한 줄 또는 두 줄(예: 들어오는 양 · 처리한 양). 같은 단위라 축 하나로 그린다 — 크기가
   * 크게 다른 값을 같이 넣으면 작은 쪽이 바닥에 붙으니 한 줄로 그린다.
   */
  series:
    readonly [ThroughputSeries] | readonly [ThroughputSeries, ThroughputSeries]
  unit: string
  /** 스크린리더용 제목 */
  label: string
  /**
   * 그 표본 사이에 생긴 사건 수(새 실패 등) — times와 같은 길이. 0보다 크면 마지막 선 위에
   * 빨간 점을 찍고, 범례·툴팁에 같이 보인다.
   */
  incidents?: { label: string; counts: readonly number[] }
}

const WIDTH = 600
const HEIGHT = 200
const PAD_TOP = 8
/** 표로 읽어 줄 최근 표본 수 — 전부 읽으면 너무 길다 */
const TABLE_ROWS = 12

const seriesClass = [styles.series1, styles.series2] as const
const swatchClass = [styles.swatch1, styles.swatch2] as const

const formatTime = (ms: number) =>
  new Date(ms).toLocaleTimeString('ko-KR', { hour12: false })

const formatValue = (value: number, unit: string) =>
  `${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}${unit}`

/**
 * 시각이 가로축의 어디(0~1)인지. 가로축은 실제 시각이다 — 표본 간격이 고르지 않아도
 * (다른 화면에 있던 동안 덜 자주 받음) 시간 비율이 틀어지지 않는다. 구간 밖이면 null.
 */
function positionOf(times: readonly number[], at: number) {
  const first = times[0]
  const last = times[times.length - 1]
  if (at < first || at > last) return null
  return last === first ? 0 : (at - first) / (last - first)
}

/** 가로 위치(0~1)에서 가장 가까운 표본 */
function nearestIndex(times: readonly number[], ratio: number) {
  const at = times[0] + ratio * (times[times.length - 1] - times[0])
  let best = 0
  times.forEach((time, index) => {
    if (Math.abs(time - at) < Math.abs(times[best] - at)) best = index
  })
  return best
}

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
  incidents,
}: ThroughputChartProps) {
  const [hover, setHover] = useState<number | null>(null)

  // 표본이 모이기 전엔 그래프와 같은 틀(범례·축·그림 높이)에 회색 막대를 깐다 — 카드
  // 높이가 그대로라 그래프가 그려질 때 아래 내용이 밀리지 않는다.
  if (times.length < 2) {
    return (
      <figure className={styles.root} aria-busy="true">
        <ul className={styles.legend} aria-hidden="true">
          {series.map((item, index) => (
            <li key={item.label} className={styles.legendItem}>
              <span className={swatchClass[index]} />
              {item.label}
              <Skeleton width={48} height="1em" />
            </li>
          ))}
        </ul>
        <div className={styles.plotRow} aria-hidden="true">
          <div className={styles.yAxis} />
          <div className={styles.plotPlaceholder}>
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

  const max = niceMax(Math.max(...series.flatMap((it) => it.values)))
  const xOf = (index: number) => (positionOf(times, times[index]) ?? 0) * WIDTH
  const yOf = (value: number) => HEIGHT - (value / max) * (HEIGHT - PAD_TOP)
  const pathOf = (values: readonly number[]) =>
    values
      .map(
        (value, index) => `${xOf(index).toFixed(1)},${yOf(value).toFixed(1)}`,
      )
      .join(' ')

  const lastSeries = series[series.length - 1]
  // 두 줄이면 사이를 옅게 칠한다 — 벌어진 만큼이 쌓이는 적체다.
  const between =
    series.length === 2
      ? `M${pathOf(series[0].values)} L${pathOf(series[1].values).split(' ').reverse().join(' L')} Z`
      : null
  const incidentAt = (index: number) => incidents?.counts[index] ?? 0

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - box.left) / box.width
    setHover(nearestIndex(times, Math.min(1, Math.max(0, ratio))))
  }

  const last = times.length - 1
  const shown = hover ?? last
  const hoverLeft = `${(positionOf(times, times[shown]) ?? 0) * 100}%`

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
        {incidents && (
          <li className={styles.legendItem}>
            <span className={styles.incidentSwatch} aria-hidden="true" />
            {incidents.label}
          </li>
        )}
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
            .join(', ')}${
            incidents
              ? `, ${incidents.label} ${incidents.counts.reduce((a, b) => a + b, 0)}건`
              : ''
          }`}
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
            {between && <path className={styles.between} d={between} />}
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

          {times.map((time, index) =>
            incidentAt(index) > 0 ? (
              <span
                key={time}
                className={styles.incident}
                style={{
                  left: `${(xOf(index) / WIDTH) * 100}%`,
                  top: `${(yOf(lastSeries.values[index]) / HEIGHT) * 100}%`,
                }}
                aria-hidden="true"
              />
            ) : null,
          )}
          {hover !== null && (
            <>
              <span className={styles.crosshair} style={{ left: hoverLeft }} />
              <div
                role="tooltip"
                className={
                  (positionOf(times, times[shown]) ?? 0) > 0.5
                    ? styles.tooltipLeft
                    : styles.tooltipRight
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
                {incidents && incidentAt(shown) > 0 && (
                  <div className={styles.tooltipRow}>
                    <span
                      className={styles.incidentSwatch}
                      aria-hidden="true"
                    />
                    {incidents.label}
                    <span className={styles.legendValue}>
                      +{formatValue(incidentAt(shown), '건')}
                    </span>
                  </div>
                )}
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
