import { style } from '@vanilla-extract/css'

import { color, onDark, typography } from '@shared/config/theme'

export const ORBIT_SIZE = 360

export const wrapper = style({ display: 'flex', justifyContent: 'center' })

// 행성·이름표는 원 밖으로 조금 나가도 보이게 둔다 — 흐리게 지우는 건 궤도선(svg)뿐이다.
export const frame = style({ position: 'relative' })

export const canvas = style({
  position: 'absolute',
  left: 0,
  top: 0,
  width: ORBIT_SIZE,
  height: ORBIT_SIZE,
  transformOrigin: '0 0',
})

// 원 바깥을 흐리게 지운다 — 마스크는 알파만 보므로 색은 무엇이든 된다.
export const svg = style({
  position: 'absolute',
  inset: 0,
  maskImage: 'radial-gradient(circle, black 62%, transparent 71%)',
})

export const repoBorder = style({ borderColor: onDark(60) })

export const repoLabel = style({
  position: 'absolute',
  zIndex: 4,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  transformOrigin: '0 0',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  textShadow: `0 0 6px ${color.backgroundDark.base}, 0 0 2px ${color.backgroundDark.base}`,
})

export const repoName = style([
  typography.body.captionMedium,
  { color: color.text.inverse },
])

export const repoCaption = style({
  fontSize: '10px',
  lineHeight: 1.3,
  color: onDark(45),
})
