import { style } from '@vanilla-extract/css'

import { color, spacing } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  alignItems: 'stretch',
  height: 'calc(100vh - 70px)',
  overflow: 'hidden',
  background: color.background.surface,
})

export const content = style({
  flex: '1 1 0%',
  minWidth: 0,
  overflowY: 'auto',
  padding: `${spacing[40]} ${spacing[80]} ${spacing[40]} ${spacing[20]}`,
})
