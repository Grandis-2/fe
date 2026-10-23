import { style } from '@vanilla-extract/css'

import { spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
})
