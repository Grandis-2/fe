import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const list = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
  gap: spacing[8],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

const stepBase = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
  padding: `${spacing[12]} ${spacing[14]}`,
  borderRadius: '10px',
  border: '1px solid transparent',
  background: color.background.surface,
})

// 끝난 단계는 남색 바탕, 지금 단계는 테두리, 막힌 단계는 빨간 테두리.
export const step = styleVariants({
  done: [stepBase, { background: color.primary.subtler }],
  now: [
    stepBase,
    { background: color.background.base, borderColor: color.primary.base },
  ],
  warn: [
    stepBase,
    { background: color.background.base, borderColor: color.status.warning },
  ],
  stuck: [
    stepBase,
    { background: color.background.base, borderColor: color.status.danger },
  ],
  todo: [stepBase],
})

const labelBase = style([typography.body.defaultMedium])

export const label = styleVariants({
  done: [labelBase, { color: color.primary.focus }],
  now: [labelBase, { color: color.primary.base }],
  warn: [labelBase, { color: color.text.primary }],
  stuck: [labelBase, { color: color.status.danger }],
  todo: [labelBase, { color: color.text.tertiary }],
})

export const detail = style([
  typography.body.caption,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])
