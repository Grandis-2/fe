import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion } from '@shared/config/theme'

export const root = style({ display: 'flex', gap: '3px' })

const cellBase = style({
  flex: '1 1 0',
  height: '14px',
  borderRadius: '3px',
  transition: `background ${motion.duration.normal} ${motion.easing.default}`,
})

export const cell = styleVariants({
  off: [cellBase, { background: color.background.subSurface }],
  on: [cellBase, { background: color.primary.base }],
  full: [cellBase, { background: color.status.warning }],
})

// 전체가 0 — 들일 칸이 없다
export const empty = style({
  height: '14px',
  borderRadius: '3px',
  border: `1px dashed ${color.status.danger}`,
  background: color.background.subtleDanger,
  boxSizing: 'border-box',
})
