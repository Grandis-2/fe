import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const job = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const jobTitle = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'baseline',
    gap: spacing[8],
    color: color.text.primary,
  },
])

export const jobMeta = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const empty = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])
