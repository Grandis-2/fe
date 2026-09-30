import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  width: '400px',
  maxWidth: '90vw',
  padding: spacing[24],
  boxSizing: 'border-box',
})

export const title = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

export const submitButton = style({ marginTop: spacing[8] })
