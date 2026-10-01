import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[40],
  width: '100%',
  maxWidth: '1000px',
})

/** 섹션 내용을 감싸는 흰 카드 */
export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const checkboxRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[10],
  cursor: 'pointer',
})

export const checkboxTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const checkboxLabel = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const checkboxHint = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])

export const period = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const periodTitle = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const footerRight = style({
  display: 'flex',
  gap: spacing[8],
})
