import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

const base = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
  padding: `${spacing[12]} ${spacing[16]}`,
  borderRadius: '12px',
  border: '1px solid transparent',
})

// 바뀐 게 있으면 고른 줄(선택 바)과 같은 옅은 남색 — 저장할 게 남았다는 표시다.
export const root = styleVariants({
  idle: [
    base,
    { background: color.background.surface, borderColor: color.border.default },
  ],
  changed: [
    base,
    {
      background: color.primary.subtler,
      borderColor: color.primary.subtlerHover,
    },
  ],
})

export const summary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
  minWidth: 0,
})

export const title = style([
  typography.body.defaultMedium,
  { color: color.primary.focus },
])

export const changes = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${spacing[4]} ${spacing[14]}`,
    margin: 0,
    padding: 0,
    listStyle: 'none',
    color: color.primary.base,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const problem = style([
  typography.body.sub,
  { color: color.status.danger },
])

export const actions = style({
  display: 'flex',
  gap: spacing[8],
  marginLeft: 'auto',
})
