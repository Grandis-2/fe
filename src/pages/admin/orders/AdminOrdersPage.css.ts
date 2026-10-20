import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const title = style([
  typography.title.xxlSemibold,
  { color: color.text.primary },
])

export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

// 오른쪽 끝에 붙인다. 칸 아래 오류 문구가 생겨도 버튼은 칸 높이에 맞춘다.
export const lookup = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[8],
  marginLeft: 'auto',
})

export const count = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const orderNo = style([
  typography.body.subMedium,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const navigator = style({
  alignSelf: 'center',
})
