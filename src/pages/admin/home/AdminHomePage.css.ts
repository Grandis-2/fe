import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

// 다른 관리자 화면(예약 현황·대기열 관리)의 제목과 같은 크기다.
export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])
