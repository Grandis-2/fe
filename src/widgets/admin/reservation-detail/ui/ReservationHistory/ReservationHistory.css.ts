import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const item = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 160px) minmax(0, 1fr)',
  gap: spacing[16],
  padding: `${spacing[12]} 0`,
  selectors: {
    '&:not(:last-child)': { borderBottom: `1px solid ${color.border.subtle}` },
  },
})

export const time = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const body = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${spacing[6]} ${spacing[10]}`,
  minWidth: 0,
})

export const title = style([
  typography.body.defaultRegular,
  { color: color.text.primary },
])

export const actor = style([
  typography.body.captionMedium,
  {
    padding: `${spacing[2]} ${spacing[8]}`,
    borderRadius: '6px',
    background: color.background.surface,
    color: color.text.secondary,
  },
])

export const error = style([
  typography.body.sub,
  { flexBasis: '100%', color: color.status.danger },
])

export const note = style([
  typography.body.sub,
  { flexBasis: '100%', color: color.text.secondary },
])

export const empty = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])
