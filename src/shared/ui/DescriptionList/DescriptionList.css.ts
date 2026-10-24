import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'grid',
  gridTemplateColumns: '96px minmax(0, 1fr)',
  gap: `${spacing[12]} ${spacing[16]}`,
  margin: 0,
})

export const term = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const value = style([
  typography.body.defaultRegular,
  {
    margin: 0,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
    overflowWrap: 'anywhere',
  },
])
