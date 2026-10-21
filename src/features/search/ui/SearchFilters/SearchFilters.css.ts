import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'

import { label as labelColor } from '../search.css'

export const root = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: spacing[16],
  '@media': {
    [breakpoint.mobile]: { flexDirection: 'column', gap: spacing[12] },
  },
})

export const groups = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  minWidth: 0,
  '@media': {
    [breakpoint.mobile]: { width: '100%' },
  },
})

export const group = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[16],
  minWidth: 0,
  '@media': {
    [breakpoint.mobile]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: spacing[8],
    },
  },
})

export const groupLabel = style([
  typography.body.captionMedium,
  { flexShrink: 0, width: '40px', color: labelColor },
])

// 모바일에선 칩이 많아도 줄이 늘지 않게 가로로 넘긴다.
export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
  '@media': {
    [breakpoint.mobile]: {
      flexWrap: 'nowrap',
      width: '100%',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    },
  },
})

export const side = style({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: spacing[12],
  '@media': {
    [breakpoint.mobile]: { width: '100%', justifyContent: 'flex-end' },
  },
})

export const reset = style([
  typography.body.captionMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[4],
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: labelColor,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    selectors: { '&:hover': { color: color.text.inverse } },
  },
])
