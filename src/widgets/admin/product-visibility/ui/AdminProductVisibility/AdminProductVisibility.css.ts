import { style } from '@vanilla-extract/css'

import { spacing } from '@shared/config/theme'

export const root = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[8],
})
