import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { color, statusOnDark } from '@shared/config/theme'

// 아이콘 색은 전부 currentColor라 여기서 정한 color 하나로 행성·궤도·기호가 같이 물든다.
export const tone = styleVariants({
  success: { color: color.primary.subtle },
  pending: { color: color.status.warning },
  failure: { color: statusOnDark.danger },
})

export const root = style({ display: 'block', overflow: 'visible' })

const drawIn = keyframes({ to: { strokeDashoffset: 0 } })
const spin = keyframes({ to: { transform: 'rotate(360deg)' } })

// 선이 그려지며 나타난다 — 길이·시간은 선마다 달라 인라인 변수(--len 등)로 받는다.
export const draw = style({
  strokeDasharray: 'var(--len)',
  strokeDashoffset: 'var(--len)',
  animation: `${drawIn} var(--dur) var(--delay) var(--ease, ease) forwards`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
      strokeDashoffset: 0,
    },
  },
})

// 대기 시계의 분침.
export const hand = style({
  transformOrigin: '0 0',
  animation: `${spin} 8s linear infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})
