import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

// 다른 관리자 화면(예약 현황·상품 관리)의 제목과 같은 크기다.
export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const description = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const scope = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[6],
})

export const scopeLabel = style([
  typography.body.caption,
  { marginRight: spacing[4], color: color.text.tertiary },
])
