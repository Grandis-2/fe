import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const title = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

/** 안내 문구와 이동 버튼을 한 줄에 둔다 — 좁아지면 버튼이 아래로 내려간다 */
export const lockedRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: spacing[12],
})

export const hint = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])
