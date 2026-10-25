import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
  padding: `${spacing[20]} ${spacing[24]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  minWidth: 0,
})

export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const title = style([
  typography.title.mdSemibold,
  {
    margin: 0,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: spacing[8],
    color: color.text.primary,
  },
])

export const aside = style([
  typography.body.caption,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[6],
    color: color.text.tertiary,
  },
])
