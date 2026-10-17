import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
  gap: spacing[16],
  alignItems: 'start',
})

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const groupLabel = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

export const checks = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[16],
})

export const check = style([
  typography.body.defaultRegular,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[8],
    color: color.text.primary,
    cursor: 'pointer',
  },
])

export const error = style([
  typography.body.caption,
  { color: color.status.danger },
])

export const save = style({
  alignSelf: 'flex-end',
})
