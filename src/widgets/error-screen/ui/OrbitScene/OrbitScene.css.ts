import { style } from '@vanilla-extract/css'

import { color, onDark } from '@shared/config/theme'
import { fontFamily } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'block',
  width: '100%',
  height: '100%',
})

// 화면 크기와 상관없이 선 굵기를 1px로 둔다(viewBox가 slice로 늘어나도).
const hairline = {
  fill: 'none',
  vectorEffect: 'non-scaling-stroke',
} as const

export const line = style({
  ...hairline,
  stroke: color.text.inverse,
  strokeWidth: 1,
})

export const trail = style({
  ...hairline,
  stroke: color.text.inverse,
  strokeLinecap: 'round',
})

export const sun = style({ fill: color.text.inverse })

// 점이 궤도선 위에 떠 보이게 바탕색 테두리를 두른다.
const dot = {
  stroke: color.backgroundDark.base,
  strokeWidth: 1.5,
  paintOrder: 'stroke',
} as const

export const planet = style({ ...dot, fill: color.text.inverse })

export const innerPlanet = style({ ...dot, fill: onDark(74) })

export const lostPath = style({
  ...hairline,
  stroke: color.primary.subtle,
  strokeDasharray: '2 4',
})

export const lostGlow = style({
  fill: color.primary.subtle,
  fillOpacity: 0.22,
})

export const lost = style({ fill: color.primary.subtle })

// viewBox 단위 글자 — 화면과 같이 커지고 작아진다.
export const label = style({
  fontFamily: fontFamily.michroma,
  fontSize: 6,
  letterSpacing: '0.08em',
  fill: color.text.inverse,
})

export const labelAccent = style({
  fontFamily: fontFamily.michroma,
  fontSize: 5,
  letterSpacing: '0.12em',
  fill: color.primary.subtle,
})
