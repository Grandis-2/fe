import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

// 왼쪽 입력, 오른쪽 미리보기. 좁으면 미리보기가 아래로 내려간다.
export const columns = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[24],
  alignItems: 'flex-start',
})

export const fields = style({
  flex: '3 1 480px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const pair = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: spacing[16],
  alignItems: 'start',
})

export const triple = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
  gap: spacing[12],
  alignItems: 'start',
})

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
})

export const groupLabel = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const hint = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

// 느린 꼬리 — 켜고 끄는 묶음이라 회색 바탕으로 한 덩어리로 보인다.
export const tail = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  padding: spacing[16],
  borderRadius: '10px',
  background: color.background.surface,
})

export const switchRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
  cursor: 'pointer',
})

export const switchText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const preview = style({
  flex: '2 1 300px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
  padding: `${spacing[16]} ${spacing[20]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.page,
})

export const previewHead = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const previewTitle = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const previewNow = style([
  typography.body.sub,
  {
    paddingTop: spacing[12],
    borderTop: `1px solid ${color.border.subtle}`,
    color: color.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
])
