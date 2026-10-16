import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const item = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${spacing[4]} ${spacing[20]}`,
})

export const time = style([
  typography.body.defaultRegular,
  {
    flexShrink: 0,
    color: color.text.tertiary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const body = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[20],
})

export const change = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

/** 관리자 사유 — 무엇 때문에 바뀌었는지 */
export const reason = style([
  typography.body.defaultRegular,
  { flexBasis: '100%', color: color.text.secondary },
])

export const empty = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])
