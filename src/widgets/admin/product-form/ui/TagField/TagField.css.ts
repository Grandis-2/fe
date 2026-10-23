import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const addRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
  maxWidth: '420px',
})

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  gap: spacing[8],
})

export const groupTitle = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const tags = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

/** 접힌 목록을 여는 줄 — 태그가 아니라 조작이라 칩 모양을 쓰지 않는다 */
export const moreButton = style([
  typography.body.subMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[6],
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: color.primary.base,
    cursor: 'pointer',
  },
])

export const chevron = style({
  width: '16px',
  height: '16px',
  transition: `transform ${motion.duration.fast} ${motion.easing.default}`,
})

export const chevronUp = style([chevron, { transform: 'rotate(180deg)' }])
