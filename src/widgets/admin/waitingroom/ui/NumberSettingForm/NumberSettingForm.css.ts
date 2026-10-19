import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const hint = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

// 바꾸기 전 비교 — 입력 칸 아래에 "지금 → 바꾸면"을 띄운다.
export const preview = style([
  typography.body.sub,
  {
    padding: `${spacing[12]} ${spacing[16]}`,
    borderRadius: '8px',
    background: color.primary.subtler,
    color: color.primary.base,
  },
])
