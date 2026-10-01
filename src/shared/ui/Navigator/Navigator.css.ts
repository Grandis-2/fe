import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[16],
})

export const arrowButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '38px',
  height: '38px',
  padding: 0,
  borderRadius: '9999px',
  border: 'none',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover:not(:disabled)': {
      background: 'transparent',
      color: color.primary.base,
    },
  },
})

export const arrowIcon = style({
  width: '16px',
  height: '16px',
})

export const arrowIconFlipped = style({
  transform: 'rotate(180deg)',
})

export const pageButton = style([
  typography.body.sub,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '9999px',
    border: 'none',
    background: color.background.base,
    color: color.text.tertiary,
    cursor: 'pointer',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.primary.subtler,
      },
    },
  },
])

export const ellipsis = style([
  typography.body.sub,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    color: color.text.tertiary,
  },
])

export const pageButtonActive = style([
  typography.body.subMedium,
  {
    background: color.primary.subtler,
    color: color.primary.base,
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.primary.surface,
      },
    },
  },
])
