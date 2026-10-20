import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

const toneColor = {
  primary: color.primary.base,
  warning: color.status.warning,
}

const AXIS_WIDTH = '56px'
const PLOT_HEIGHT = '180px'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  margin: 0,
})

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
    paddingLeft: spacing[8],
    alignItems: 'flex-start',
    minWidth: AXIS_WIDTH,
    color: color.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const plot = style({
  position: 'relative',
  flex: 1,
  minWidth: 0,
  height: PLOT_HEIGHT,
  cursor: 'crosshair',
  touchAction: 'pan-y',
})

export const placeholder = style({
  display: 'flex',
  flex: 1,
  minWidth: 0,
  height: PLOT_HEIGHT,
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
  strokeDasharray: '3 4',
})

export const baseline = style({
  stroke: color.border.default,
  strokeWidth: 1,
})

// 처음 나타날 때 면과 선을 왼쪽부터 함께 펼친다. 값이 바뀔 때는 다시 하지 않는다.
// 선 길이(stroke-dasharray)로 그리면 굵기 고정(non-scaling-stroke)과 겹쳐 길이가 틀어져
// 선 끝이 잘린 채 남는다 — 그래서 가리는 영역(clip-path)을 넓히는 방식으로 한다.
const reveal = keyframes({
  from: { clipPath: 'inset(0 100% 0 0)' },
  to: { clipPath: 'inset(0 0 0 0)' },
})

export const marks = style({
  '@media': {
    '(prefers-reduced-motion: no-preference)': {
      animation: `${reveal} 900ms cubic-bezier(0.22, 1, 0.36, 1) both`,
    },
  },
})

const lineBase = style({
  strokeWidth: 2.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

export const line = styleVariants(toneColor, (stroke) => [lineBase, { stroke }])

export const stopTop = styleVariants(toneColor, (stopColor) => ({
  stopColor,
  stopOpacity: 0.26,
}))

export const stopBottom = styleVariants(toneColor, (stopColor) => ({
  stopColor,
  stopOpacity: 0,
}))

// 지금 값(또는 올린 시각) — 흰 테두리 점
export const dot = styleVariants(toneColor, (background) => ({
  position: 'absolute',
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  background,
  boxShadow: `0 0 0 3px ${color.background.base}`,
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
}))

export const crosshair = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: '1px',
  background: color.border.focus,
  pointerEvents: 'none',
})

const tooltip = style([
  typography.body.sub,
  {
    position: 'absolute',
    top: spacing[4],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    padding: `${spacing[6]} ${spacing[10]}`,
    borderRadius: '8px',
    border: `1px solid ${color.border.default}`,
    background: color.background.base,
    color: color.text.primary,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    fontVariantNumeric: 'tabular-nums',
  },
])
// 오른쪽 절반에선 왼쪽으로 띄워 화면 밖으로 넘치지 않게 한다.
export const tooltipRight = style([tooltip, { marginLeft: spacing[10] }])
export const tooltipLeft = style([
  tooltip,
  { transform: `translateX(calc(-100% - ${spacing[10]}))` },
])

export const tooltipTime = style([
  typography.body.caption,
  { color: color.text.secondary },
])

export const xAxis = style([
  typography.body.caption,
  {
    display: 'flex',
    justifyContent: 'space-between',
    paddingLeft: `calc(${AXIS_WIDTH} + ${spacing[8]})`,
    color: color.text.secondary,
  },
])
