import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const notFound = style([
  typography.body.sub,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[12],
    padding: `${spacing[60]} ${spacing[20]}`,
    borderRadius: '12px',
    border: `1px solid ${color.border.subtle}`,
    background: color.background.base,
    color: color.text.tertiary,
  },
])

export const refreshRow = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[8],
    color: color.text.tertiary,
  },
])

export const refreshButton = style({
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

export const refreshIcon = style({
  width: '16px',
  height: '16px',
})
