import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 띠에서 고른 카드 바로 아래에 붙는 상세 — 테두리는 화면의 다른 카드와 같게 둔다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[8],
})

export const title = style([
  typography.title.smMedium,
  { color: color.text.primary },
])

export const link = style([
  typography.body.subMedium,
  {
    marginLeft: 'auto',
    color: color.primary.base,
    textDecoration: 'underline',
  },
])

export const items = style({
  margin: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: spacing[16],
})

export const item = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const label = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const value = style([
  typography.title.smMedium,
  {
    margin: 0,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])
