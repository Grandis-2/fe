import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

const SERIES_1 = color.chart.series1
const SERIES_2 = color.chart.series2

// 글자 크기 단계 — large는 한 단계씩 키운다(운영 대시보드처럼 그래프가 화면의 중심일 때).
const text = {
  medium: {
    caption: typography.body.caption,
    sub: typography.body.sub,
    subMedium: typography.body.subMedium,
    axisWidth: '56px',
  },
  large: {
    caption: typography.body.sub,
    sub: typography.body.defaultRegular,
    subMedium: typography.body.defaultMedium,
    axisWidth: '68px',
  },
}

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  margin: 0,
})

export const legend = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[16],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const legendItem = styleVariants(text, (t) => [
  t.sub,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[6],
    color: color.text.secondary,
  },
])

export const legendValue = styleVariants(text, (t) => [
  t.subMedium,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

const swatch = style({
  width: '12px',
  height: '2px',
  borderRadius: '1px',
  flexShrink: 0,
})
export const swatch1 = style([swatch, { background: SERIES_1 }])
export const swatch2 = style([swatch, { background: SERIES_2 }])

export const plotRow = style({
  display: 'flex',
  gap: spacing[8],
})

export const yAxis = styleVariants(text, (t) => [
  t.caption,
  {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minWidth: t.axisWidth,
    color: color.text.tertiary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const plot = style({
  position: 'relative',
  flex: 1,
  minWidth: 0,
  height: '200px',
  cursor: 'crosshair',
  touchAction: 'pan-y',
})

// 표본이 모이기 전 그림 자리 — 그래프와 같은 높이를 차지한다.
export const plotPlaceholder = style({
  display: 'flex',
  flex: 1,
  minWidth: 0,
  height: '200px',
})

export const svg = style({
  display: 'block',
  width: '100%',
  height: '100%',
  overflow: 'visible',
})

export const grid = style({
  stroke: color.border.subtle,
  strokeWidth: 1,
})

export const baseline = style({
  stroke: color.border.default,
  strokeWidth: 1,
})

const line = style({
  strokeWidth: 2,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
})
export const series1 = style([line, { stroke: SERIES_1 }])
export const series2 = style([line, { stroke: SERIES_2 }])

export const crosshair = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: '1px',
  background: color.border.focus,
  pointerEvents: 'none',
})

// 사건 시각 세로선 — 데이터 선보다 눈에 띄지 않게 가늘게, 글자는 위쪽에 붙인다.

const tooltip = styleVariants(text, (t) => [
  t.caption,
  {
    position: 'absolute',
    top: spacing[8],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
    padding: `${spacing[8]} ${spacing[10]}`,
    borderRadius: '8px',
    border: `1px solid ${color.border.default}`,
    background: color.background.base,
    color: color.text.secondary,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
])
// 오른쪽 절반에선 왼쪽으로 띄워 화면 밖으로 넘치지 않게 한다.
export const tooltipRight = styleVariants(tooltip, (base) => [
  base,
  { marginLeft: spacing[8] },
])
export const tooltipLeft = styleVariants(tooltip, (base) => [
  base,
  { transform: `translateX(calc(-100% - ${spacing[8]}))` },
])

export const tooltipTime = style({ color: color.text.tertiary })

export const tooltipRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[6],
})

export const xAxis = styleVariants(text, (t) => [
  t.caption,
  {
    display: 'flex',
    justifyContent: 'space-between',
    paddingLeft: `calc(${t.axisWidth} + ${spacing[8]})`,
    color: color.text.tertiary,
  },
])
