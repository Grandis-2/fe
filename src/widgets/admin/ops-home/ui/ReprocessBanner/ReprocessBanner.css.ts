import { globalStyle, style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

// 긴급 띠(UrgentBanner)와 같은 틀에 브랜드색 — 실패가 아니라 진행 중인 일이다.
export const root = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[16],
  padding: `${spacing[16]} ${spacing[20]}`,
  borderRadius: '14px',
  border: `1px solid ${color.primary.subtlerHover}`,
  background: color.primary.subtler,
})

export const icon = style({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: color.primary.base,
  color: color.text.inverse,
})
globalStyle(`${icon} svg`, { width: '20px', height: '20px' })

export const text = style({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const headline = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: `${spacing[2]} ${spacing[10]}`,
})

export const kicker = style([
  typography.body.subSemibold,
  { color: color.primary.base },
])

export const title = style([
  typography.title.mdSemibold,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const bar = style({
  maxWidth: '520px',
  height: '8px',
  borderRadius: '9999px',
  background: color.primary.subtlerHover,
  overflow: 'hidden',
})

export const barFill = style({
  display: 'block',
  height: '100%',
  borderRadius: '9999px',
  background: color.primary.base,
  transition: 'width 1s linear',
})

export const action = style([
  typography.button.smMedium,
  {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40px',
    padding: `0 ${spacing[16]}`,
    borderRadius: '9999px',
    border: `1px solid ${color.primary.subtlerHover}`,
    background: color.background.base,
    color: color.primary.base,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:hover': { background: color.background.surface } },
  },
])
