import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[8],
    color: color.text.tertiary,
  },
])

export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[4],
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { color: color.primary.base },
  },
})

export const icon = style({
  width: '16px',
  height: '16px',
})
