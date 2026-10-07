import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

const divider = `1px solid ${color.border.subtle}`
const padX = {
  paddingInline: spacing[24],
  '@media': { [breakpoint.mobile]: { paddingInline: spacing[20] } },
}

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '20px',
  border: divider,
  background: color.background.base,
})

export const header = style([
  padX,
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[12],
    paddingBlock: '18px',
    borderBottom: divider,
    fontWeight: fontWeight.bold,
  },
])

// 카드 머리에선 Tag small(10px)이 작다 — HistoryCard 태그와 같은 12px.
export const tag = style({
  fontSize: '12px',
  fontWeight: fontWeight.bold,
  padding: `3px ${spacing[8]}`,
})

export const rows = style([
  padX,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[12],
    margin: 0,
    paddingBlock: spacing[20],
  },
])

export const row = style([
  typography.body.defaultRegular,
  { display: 'flex', gap: spacing[16] },
])

export const rowLabel = style({
  flexShrink: 0,
  width: '84px',
  color: color.text.tertiary,
})

export const rowValue = style({
  flex: 1,
  minWidth: 0,
  margin: 0,
  color: color.text.primary,
  textWrap: 'pretty',
})

// 카드보다 한 단계 어두운 바닥(HistoryCard와 같은 구조).
export const footer = style([
  padX,
  {
    paddingBlock: '18px',
    borderTop: divider,
    background: color.background.page,
  },
])

export const action = style({ width: '100%' })
