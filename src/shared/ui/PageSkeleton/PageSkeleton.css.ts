import { style } from '@vanilla-extract/css'

import { spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[40],
  width: '100%',
})

export const titleRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})
