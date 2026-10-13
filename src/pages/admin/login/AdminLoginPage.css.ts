import { style } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: spacing[16],
  background: color.background.base,
})
