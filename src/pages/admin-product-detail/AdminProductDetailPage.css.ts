import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const titleRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const notFound = style([
  typography.body.sub,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[12],
    padding: `${spacing[60]} ${spacing[20]}`,
    borderRadius: '12px',
    border: `1px solid ${color.border.subtle}`,
    background: color.background.base,
    color: color.text.tertiary,
  },
])
