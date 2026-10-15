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

export const due = style([
  typography.body.caption,
  { color: color.primary.base },
])

// 상태 태그와 떨어뜨려, 조치 버튼임을 드러낸다.
export const actions = style({
  display: 'flex',
  gap: spacing[8],
  marginLeft: 'auto',
})

export const cards = style({
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
