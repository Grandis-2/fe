import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const cards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: spacing[16],
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

// 좁은 화면에선 이름 · 값 · 버튼이 차례로 줄바꿈된다.
export const settingRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

export const settingLabel = style([
  typography.body.defaultMedium,
  { minWidth: '120px', color: color.text.primary },
])

export const settingValue = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    color: color.text.primary,
  },
])

export const rowActions = style({
  display: 'flex',
  justifyContent: 'center',
  gap: spacing[8],
  marginLeft: 'auto',
})

export const subText = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

// 불러오는 동안의 줄 — 줄 사이를 실제 설정 줄과 비슷하게 띄운다.
export const skeletonRows = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})
