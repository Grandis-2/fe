import { style } from '@vanilla-extract/css'

import { spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  paddingBottom: spacing[100],
})

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const retry = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[12],
})
