import { style } from '@vanilla-extract/css'

import { color, onDark, statusOnDark } from '@shared/config/theme'
import { fontFamily } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'block',
  width: '100%',
  height: '100%',
})

export const star = style({ fill: color.text.inverse })

// 화면 크기와 상관없이 선 굵기를 1px로 둔다(viewBox가 slice로 늘어나도).
export const grid = style({
  fill: 'none',
  stroke: color.text.inverse,
  strokeWidth: 1,
  strokeLinejoin: 'round',
  vectorEffect: 'non-scaling-stroke',
})

export const trail = style({
  fill: 'none',
  stroke: statusOnDark.danger,
  strokeLinecap: 'round',
  vectorEffect: 'non-scaling-stroke',
})

// 점이 격자 위에 떠 보이게 바탕색 테두리를 두른다.
export const signal = style({
  fill: statusOnDark.danger,
  stroke: color.backgroundDark.base,
  strokeWidth: 1.5,
  paintOrder: 'stroke',
})

export const leader = style({
  stroke: onDark(45),
  strokeWidth: 1,
  vectorEffect: 'non-scaling-stroke',
})

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
  fill: statusOnDark.danger,
})
