import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: spacing[12],
})

const pressable = style({
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { borderColor: color.border.hover },
    // 고른 것 — 테두리와 바탕을 함께 바꿔 색을 못 보는 사람도 구분하게 한다.
    '&[aria-pressed="true"]': {
      borderColor: color.primary.base,
      background: color.primary.subtler,
    },
  },
})

export const card = style([
  pressable,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[6],
    padding: `${spacing[14]} ${spacing[16]}`,
    minWidth: 0,
  },
])

export const head = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
  minWidth: 0,
})

export const name = style([
  typography.title.smMedium,
  {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: color.text.primary,
  },
])

export const meta = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const empty = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])
