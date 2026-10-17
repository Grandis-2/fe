import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

// 좁은 화면에선 상품·옵션이 위아래로 쌓인다.
export const row = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
  gap: spacing[12],
})

export const hint = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const footer = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
  marginTop: spacing[8],
})
