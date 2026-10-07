import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  gap: spacing[8],
  flexWrap: 'wrap',
})

export const hint = style([typography.body.sub, { color: color.text.tertiary }])
