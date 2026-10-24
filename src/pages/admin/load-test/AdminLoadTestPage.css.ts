import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const scope = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[6],
})

export const scopeLabel = style([
  typography.body.caption,
  { marginRight: spacing[4], color: color.text.tertiary },
])
