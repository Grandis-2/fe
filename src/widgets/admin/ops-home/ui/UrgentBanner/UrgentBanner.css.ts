import { globalStyle, style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

const dangerTint = (percent: number) =>
  `color-mix(in srgb, ${color.status.danger} ${percent}%, transparent)`

const row = style({
  display: 'flex',
  alignItems: 'center',
})

// 처리 버튼 — 위험색 알약
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
    background: color.status.danger,
    color: color.text.inverse,
    border: 0,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: `filter ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:hover': { filter: 'brightness(0.92)' } },
  },
])

const iconBase = style({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
})

// ── 한 건: 경고 띠 ──────────────────────────────────────────

export const banner = style([
  row,
  {
    gap: spacing[16],
    padding: `${spacing[16]} ${spacing[20]}`,
    borderRadius: '14px',
    border: `1px solid ${dangerTint(30)}`,
    background: color.background.subtleDanger,
  },
])

export const icon = style([
  iconBase,
  {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: color.status.danger,
    color: color.text.inverse,
  },
])
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
  { color: color.status.danger },
])

export const title = style([
  typography.title.mdSemibold,
  { color: color.text.primary },
])

export const count = style({
  color: color.status.danger,
  fontVariantNumeric: 'tabular-nums',
})

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[6],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const chip = style([
  typography.body.sub,
  {
    padding: `${spacing[6]} ${spacing[10]}`,
    borderRadius: '9999px',
    border: `1px solid ${dangerTint(30)}`,
    background: color.background.base,
    color: color.status.danger,
    whiteSpace: 'nowrap',
  },
])

// ── 위에 붙어 있을 때: 얇은 한 줄 ───────────────────────────

export const compact = style([
  row,
  {
    gap: spacing[12],
    padding: `${spacing[8]} ${spacing[8]} ${spacing[8]} ${spacing[16]}`,
    borderRadius: '9999px',
    background: color.status.danger,
    color: color.text.inverse,
  },
])

export const compactIcon = iconBase
globalStyle(`${compactIcon} svg`, { width: '18px', height: '18px' })

export const compactTitle = style([
  typography.body.defaultMedium,
  {
    flex: '1 1 0',
    minWidth: 0,
    fontWeight: fontWeight.bold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
])

export const compactAction = style([
  typography.button.smMedium,
  {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '32px',
    padding: `0 ${spacing[14]}`,
    borderRadius: '9999px',
    background: color.background.base,
    color: color.status.danger,
    border: 0,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
])

// ── 여러 건: 머리 + 줄 ──────────────────────────────────────

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  padding: `${spacing[6]} ${spacing[20]}`,
  borderRadius: '14px',
  border: `1.5px solid ${color.status.danger}`,
  background: color.background.base,
})

export const listHead = style([
  row,
  typography.body.subSemibold,
  { gap: spacing[8], padding: `${spacing[8]} 0`, color: color.status.danger },
])

export const listIcon = iconBase
globalStyle(`${listIcon} svg`, { width: '18px', height: '18px' })

export const listRow = style([
  row,
  {
    gap: spacing[12],
    padding: `${spacing[10]} 0`,
    borderTop: `1px solid ${dangerTint(20)}`,
  },
])

export const listTitle = style([
  typography.body.defaultMedium,
  {
    flex: '1 1 0',
    minWidth: 0,
    fontWeight: fontWeight.semibold,
    color: color.text.primary,
  },
])
