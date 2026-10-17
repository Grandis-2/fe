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

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const runBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

export const sectionTitle = style([
  typography.title.mdSemibold,
  { margin: 0, color: color.text.primary },
])

export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

// 시각·탭과 떨어뜨려 조치 버튼임을 드러낸다.
export const runButton = style({
  marginLeft: 'auto',
})

export const note = style([typography.body.sub, { color: color.text.tertiary }])

export const stacked = style({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[2],
})

export const subText = style([
  typography.body.caption,
  { color: color.text.tertiary },
])
