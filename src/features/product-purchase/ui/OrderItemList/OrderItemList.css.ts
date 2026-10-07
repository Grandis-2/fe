import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const header = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing[8],
  marginBottom: spacing[12],
})

export const title = typography.title.mdSemibold

export const count = style([
  typography.body.subSemibold,
  { color: color.primary.subtle },
])

export const list = style({
  display: 'flex',
  flexDirection: 'column',
})

// 상품 사이에만 선을 긋는다 — 첫 상품 위는 제목과 붙어 있어 선이 필요 없다.
export const item = style({
  padding: `${spacing[16]} 0`,
  selectors: {
    '&:first-child': { paddingTop: 0 },
    '& + &': { borderTop: `1px solid ${color.border.subtle}` },
  },
})

export const toggle = style([
  typography.body.subSemibold,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
    height: '48px',
    border: `1px solid ${color.border.default}`,
    borderRadius: '12px',
    background: color.background.surface,
    color: color.text.secondary,
    cursor: 'pointer',
    transition: [
      `color ${motion.duration.fast} ${motion.easing.default}`,
      `border-color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover': {
        color: color.text.primary,
        borderColor: color.border.hover,
      },
    },
  },
])

export const toggleIcon = style({
  width: '16px',
  height: '16px',
  transition: `transform ${motion.duration.fast} ${motion.easing.default}`,
})

export const toggleIconOpen = style({ transform: 'rotate(180deg)' })
