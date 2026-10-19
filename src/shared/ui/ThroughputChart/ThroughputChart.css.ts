import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

const SERIES_1 = color.chart.series1
const SERIES_2 = color.chart.series2

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  margin: 0,
})

export const empty = style([
  typography.body.sub,
  {
    padding: spacing[24],
    textAlign: 'center',
    color: color.text.tertiary,
  },
])

export const legend = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[16],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const legendItem = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[6],
    color: color.text.secondary,
  },
])

export const legendValue = style([
  typography.body.subMedium,
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

export const yAxis = style([
  typography.body.caption,
  {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minWidth: '56px',
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

const tooltip = style([
  typography.body.caption,
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
export const tooltipRight = style([tooltip, { marginLeft: spacing[8] }])
export const tooltipLeft = style([
  tooltip,
  { transform: `translateX(calc(-100% - ${spacing[8]}))` },
])

export const tooltipTime = style({ color: color.text.tertiary })

export const tooltipRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[6],
})

export const xAxis = style([
  typography.body.caption,
  {
    display: 'flex',
    justifyContent: 'space-between',
    paddingLeft: `calc(56px + ${spacing[8]})`,
    color: color.text.tertiary,
  },
])
