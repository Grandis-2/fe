import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const title = style([
  typography.title.mdMedium,
  { color: color.text.tertiary },
])

export const description = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary, whiteSpace: 'pre-line' },
])

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  marginTop: spacing[4],
})
