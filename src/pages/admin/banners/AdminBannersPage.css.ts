import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
})

// 다른 관리자 화면(예약 현황·상품 관리)의 제목과 같은 크기다.
export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const bannerTitle = style([
  typography.body.subMedium,
  { color: color.text.primary },
])
