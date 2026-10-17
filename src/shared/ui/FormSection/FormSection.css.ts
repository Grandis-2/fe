import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

// 섹션을 나누는 제목이라 본문(입력칸 라벨·설명)보다 진하게 둔다.
export const title = style([
  typography.title.mdSemibold,
  { color: color.text.primary },
])

export const description = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary, whiteSpace: 'pre-line' },
])

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  marginTop: spacing[4],
})
