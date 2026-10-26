import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

export const root = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${spacing[4]} ${spacing[12]}`,
    color: color.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const label = style({ color: color.text.tertiary })

// 새로 생긴 불일치 — 눈에 먼저 띄게.
export const alert = style({
  color: color.status.danger,
  fontWeight: fontWeight.semibold,
})
