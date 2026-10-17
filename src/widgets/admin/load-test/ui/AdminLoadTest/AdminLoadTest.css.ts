import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const cards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: spacing[16],
})

// 카드 값 아래에 그래프를 붙인다.
export const trend = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

/** 섹션 내용을 감싸는 흰 카드 */
export const card = style({
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const subTitle = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const mockSummary = style([
  typography.body.defaultRegular,
  { color: color.text.primary },
])

export const link = style({
  color: color.primary.base,
  textDecoration: 'underline',
})

export const externalLink = style([
  typography.body.subMedium,
  {
    color: color.primary.base,
    textDecoration: 'underline',
  },
])
