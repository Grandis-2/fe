import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

const base = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  padding: `${spacing[16]} ${spacing[20]}`,
  borderRadius: '12px',
  border: '1px solid',
  textDecoration: 'none',
  color: color.text.primary,
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
})

export const root = styleVariants({
  default: [
    base,
    {
      borderColor: color.border.default,
      background: color.background.base,
      selectors: { '&:hover': { borderColor: color.primary.subtle } },
    },
  ],
  // 처리 안 하면 결제로 못 넘어가는 숫자 — 바탕까지 칠해 줄에서 먼저 보이게 한다.
  danger: [
    base,
    {
      borderColor: color.status.danger,
      background: color.background.subtleDanger,
      color: color.status.danger,
      selectors: { '&:hover': { borderColor: color.status.danger } },
    },
  ],
})

export const head = style([
  typography.body.subSemibold,
  {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing[8],
  },
])

export const linkLabel = style([
  typography.body.caption,
  { whiteSpace: 'nowrap' },
])

export const value = style([
  typography.title.xlSemibold,
  { fontVariantNumeric: 'tabular-nums' },
])

export const unit = style([
  typography.body.defaultMedium,
  { marginLeft: spacing[2] },
])

export const description = style([
  typography.body.caption,
  { color: color.text.secondary },
])
