import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const title = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: spacing[16],
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  textDecoration: 'none',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': {
      borderColor: color.primary.base,
    },
  },
})

export const cardTitle = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const cardDescription = style([
  typography.body.sub,
  { color: color.text.secondary },
])
