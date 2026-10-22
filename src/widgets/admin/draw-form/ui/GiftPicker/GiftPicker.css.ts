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

// 고른 옵션과 확보할 재고 — 칸 아래 회색 상자.
export const stock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  padding: `${spacing[12]} ${spacing[14]}`,
  borderRadius: '10px',
  background: color.background.surface,
})

export const stockName = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const stockText = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const footer = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
  marginTop: spacing[8],
})
