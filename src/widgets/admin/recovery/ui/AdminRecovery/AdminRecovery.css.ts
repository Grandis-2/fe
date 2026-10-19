import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const steps = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${spacing[8]} ${spacing[24]}`,
})

export const step = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    color: color.text.tertiary,
  },
])

export const stepReached = style({ color: color.text.primary })

export const stepNumber = style([
  typography.body.subMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: color.background.subSurface,
    color: color.text.secondary,
    selectors: {
      [`${stepReached} &`]: {
        background: color.primary.base,
        color: color.text.inverse,
      },
    },
  },
])

// 원인 고르기가 넓고 보내기가 좁다 — 좁은 화면에선 한 줄씩 쌓인다.
export const columns = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: spacing[16],
  alignItems: 'start',
})

/** 섹션 내용을 감싸는 흰 카드 */
export const card = style({
  minWidth: 0,
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const cause = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  minHeight: '44px',
  padding: `${spacing[12]} ${spacing[16]}`,
  borderRadius: '10px',
  border: `1px solid ${color.border.default}`,
  cursor: 'pointer',
})

export const causePicked = style({
  borderColor: color.primary.base,
  background: color.primary.subtler,
})

export const causeCode = style([
  typography.title.smMedium,
  { flex: 1, minWidth: 0, color: color.text.primary },
])

export const causeCount = style([
  typography.title.mdSemibold,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const summary = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  padding: `${spacing[12]} ${spacing[16]}`,
  borderRadius: '10px',
  background: color.background.surface,
})

export const summaryValue = style([
  typography.title.lgSemibold,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const fieldLabel = style([
  typography.body.defaultMedium,
  { color: color.text.primary, fontWeight: fontWeight.medium },
])

export const cards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: spacing[16],
})

export const caption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const link = style({
  color: color.primary.base,
  textDecoration: 'underline',
})
