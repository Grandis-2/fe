import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[4],
})

export const link = style([
  typography.title.smMedium,
  {
    color: color.text.tertiary,
    textDecoration: 'none',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { color: color.primary.base, textDecoration: 'underline' },
    },
  },
])

export const icon = style({
  width: '16px',
  height: '16px',
  color: color.text.tertiary,
})

export const current = style([
  typography.title.smMedium,
  { color: color.text.primary },
])
