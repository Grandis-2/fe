import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const label = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

export const count = style([
  typography.body.caption,
  { alignSelf: 'flex-end', color: color.text.tertiary },
])
