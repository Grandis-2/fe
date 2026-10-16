import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const titleRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const alertAction = style({
  marginTop: spacing[8],
})

export const cards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: spacing[16],
})

export const columns = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
  gap: spacing[20],
  alignItems: 'start',
})

/** 섹션 내용을 감싸는 흰 카드 */
export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  margin: 0,
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const gift = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[16],
})

export const giftImage = style({
  width: '72px',
  height: '72px',
  flexShrink: 0,
  borderRadius: '8px',
  objectFit: 'cover',
  background: color.background.surface,
})

export const giftName = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const giftOption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const note = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const row = style({
  display: 'grid',
  gridTemplateColumns: '100px 1fr',
  gap: spacing[12],
})

export const term = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])

export const value = style([
  typography.body.defaultRegular,
  { margin: 0, color: color.text.primary, wordBreak: 'break-all' },
])
