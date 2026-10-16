import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

/** 섹션 내용을 감싸는 흰 카드 */
export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: spacing[16],
  alignItems: 'start',
})

export const info = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
  gap: spacing[8],
  margin: 0,
  paddingBottom: spacing[16],
  borderBottom: `1px solid ${color.border.subtle}`,
})

export const row = style({
  display: 'grid',
  gridTemplateColumns: '140px 1fr',
  gap: spacing[12],
})

export const term = style([typography.body.sub, { color: color.text.tertiary }])

export const value = style([
  typography.body.sub,
  { margin: 0, color: color.text.primary },
])

export const subText = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const action = style({
  alignSelf: 'flex-end',
})

// 불러오는 동안의 줄 — 줄 사이를 실제 설정 줄과 비슷하게 띄운다.
export const skeletonRow = style({
  selectors: { '& + &': { marginTop: spacing[16] } },
})
