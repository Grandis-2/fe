import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

const SERIES_1 = color.chart.series1
const SERIES_2 = color.chart.series2

const AXIS_WIDTH = '56px'

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
    minWidth: AXIS_WIDTH,
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

// 두 선 사이 — 적체가 쌓이는 만큼을 옅게
export const between = style({
  fill: `color-mix(in srgb, ${SERIES_1} 10%, transparent)`,
})

// 새 실패 같은 사건 — 마지막 선 위의 빨간 점
export const incidentSwatch = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: color.status.danger,
  flexShrink: 0,
})

export const incident = style([
  incidentSwatch,
  {
    position: 'absolute',
    boxShadow: `0 0 0 2px ${color.background.base}`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
])

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
    paddingLeft: `calc(${AXIS_WIDTH} + ${spacing[8]})`,
    color: color.text.tertiary,
  },
])
