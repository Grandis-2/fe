import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  width: '100%',
  maxWidth: '360px',
})

export const title = style([
  typography.title.lgSemibold,
  { color: color.text.primary, textAlign: 'center' },
])

export const hint = style([
  typography.body.sub,
  { color: color.text.tertiary, textAlign: 'center' },
])
