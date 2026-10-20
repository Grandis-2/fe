import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 대기열 관리 카드들이 같은 테두리·여백·제목을 쓴다.
export const card = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
  padding: `${spacing[20]} ${spacing[24]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const head = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const title = style([
  typography.title.mdSemibold,
  { margin: 0, color: color.text.primary },
])
