import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const title = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

export const description = style([
  typography.body.sub,
  { color: color.text.tertiary },
])
