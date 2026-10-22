import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const lane = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const laneLabel = style([
  typography.body.subSemibold,
  { color: color.primary.base, fontVariantNumeric: 'tabular-nums' },
])

/** 차수마다 순번 구간 폭만큼 나눈 막대. 채운 만큼이 발급한 순번이다 */
export const track = style({
  display: 'flex',
  height: '40px',
  borderRadius: '10px',
  overflow: 'hidden',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

export const segment = style({
  position: 'relative',
  flexBasis: 0,
  minWidth: '48px',
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${spacing[12]}`,
  selectors: {
    '& + &': { borderLeft: `1px solid ${color.border.default}` },
  },
})

export const fill = style({
  position: 'absolute',
  inset: '0 auto 0 0',
  background: color.primary.subtler,
})

export const segmentLabel = style([
  typography.body.subMedium,
  { position: 'relative', color: color.text.primary },
])

export const issued = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[6],
  fontVariantNumeric: 'tabular-nums',
})

export const note = style([typography.body.sub, { color: color.text.tertiary }])
