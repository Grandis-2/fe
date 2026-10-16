import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[4],
  color: color.status.danger,
})

export const icon = style({ width: '16px', height: '16px', flexShrink: 0 })

export const text = style([typography.body.caption])
