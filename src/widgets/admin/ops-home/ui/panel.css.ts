import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 운영 대시보드의 흰 카드 — 표·할 일·럭키드로우·주문 카드가 같은 틀을 쓴다.
export const panel = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  padding: `${spacing[20]} ${spacing[24]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

export const panelHeader = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const panelTitle = style([
  typography.title.lgSemibold,
  { margin: 0, color: color.text.primary },
])

export const panelLink = style([
  typography.body.subMedium,
  {
    color: color.primary.base,
    textDecoration: 'none',
    selectors: { '&:hover': { color: color.primary.focus } },
  },
])
