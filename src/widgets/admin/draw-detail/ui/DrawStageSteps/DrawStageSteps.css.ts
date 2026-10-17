import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

// 좁은 화면에선 단계가 줄을 바꿔 이어진다.
export const list = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${spacing[8]} ${spacing[20]}`,
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

const stepBase = style([
  typography.body.subMedium,
  { display: 'flex', alignItems: 'center', gap: spacing[8] },
])

export const step = styleVariants({
  done: [stepBase, { color: color.text.secondary }],
  current: [stepBase, { color: color.primary.base }],
  warning: [stepBase, { color: color.status.danger }],
  upcoming: [stepBase, { color: color.text.disabled }],
})

const dotBase = style({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  flexShrink: 0,
})

export const dot = styleVariants({
  done: [dotBase, { background: color.status.success }],
  current: [dotBase, { background: color.primary.base }],
  warning: [dotBase, { background: color.status.danger }],
  upcoming: [dotBase, { background: color.border.default }],
})

export const description = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const warning = style([
  typography.body.sub,
  { color: color.status.danger },
])
