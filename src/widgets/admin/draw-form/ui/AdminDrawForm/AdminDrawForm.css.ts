import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[32],
  width: '100%',
  // 다른 관리자 폼과 같은 폭 — 화면을 다 쓰면 한 줄이 너무 길어진다.
  maxWidth: '1000px',
})

// 두 칸을 나란히 두고, 좁은 화면에선 위아래로 쌓는다.
export const pair = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
  gap: spacing[12],
})

export const hint = style([
  typography.body.caption,
  { marginTop: spacing[8], color: color.text.tertiary },
])

export const alertAction = style({
  marginTop: spacing[8],
})

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[8],
  marginTop: spacing[16],
})
