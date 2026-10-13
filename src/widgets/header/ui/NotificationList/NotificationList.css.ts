import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const list = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  overflowY: 'auto',
})

export const item = style({
  display: 'grid',
  gridTemplateColumns: `${spacing[8]} minmax(0, 1fr)`,
  columnGap: spacing[12],
  padding: `${spacing[16]} ${spacing[20]}`,
  color: 'inherit',
  textDecoration: 'none',
  transition: `background-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    'a&:hover, a&:focus-visible': { background: color.background.surface },
    'li + li > &': { borderTop: `1px solid ${color.border.subtle}` },
  },
})

// 안 읽은 알림 앞의 점. 읽은 알림은 자리만 남겨 글자 줄을 맞춘다.
export const unreadDot = style({
  width: spacing[8],
  height: spacing[8],
  marginTop: spacing[6],
  borderRadius: '50%',
  background: color.primary.subtle,
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const itemHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const itemTitle = typography.body.subSemibold

export const read = style({ color: color.text.tertiary })

export const message = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const time = style([
  typography.body.caption,
  { flexShrink: 0, color: color.text.tertiary },
])

export const status = style([
  typography.body.sub,
  {
    padding: `${spacing[32]} ${spacing[20]}`,
    textAlign: 'center',
    color: color.text.tertiary,
  },
])
