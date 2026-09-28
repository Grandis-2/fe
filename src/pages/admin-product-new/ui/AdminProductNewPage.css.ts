import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const error = style([
  typography.body.sub,
  {
    padding: `${spacing[12]} ${spacing[16]}`,
    borderRadius: '8px',
    background: color.background.subtleDanger,
    color: color.status.danger,
  },
])
