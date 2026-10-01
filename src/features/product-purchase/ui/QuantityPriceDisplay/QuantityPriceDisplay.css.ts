import { style } from '@vanilla-extract/css'

import { color, typography } from '@/shared/config/theme'

export const fixedQuantity = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const price = style([typography.title.lgSemibold])
