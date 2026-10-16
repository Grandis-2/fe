import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const title = style([
  typography.title.xlSemibold,
  { color: color.text.primary },
])

export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

export const count = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const orderNo = style([
  typography.body.subMedium,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const navigator = style({
  alignSelf: 'center',
})
