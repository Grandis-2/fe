import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

const rootBase = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
  padding: `${spacing[16]} ${spacing[22]}`,
  borderRadius: '14px',
})

// 판정 색으로 바탕을 칠한다 — 화면을 열자마자 상태가 색으로 먼저 읽힌다.
export const root = styleVariants({
  success: [rootBase, { background: color.background.subtleSuccess }],
  warning: [rootBase, { background: color.background.subtleWarning }],
  danger: [rootBase, { background: color.background.subtleDanger }],
  muted: [rootBase, { background: color.background.subSurface }],
})

export const verdict = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${spacing[6]} ${spacing[10]}`,
})

const dotBase = style({
  width: '12px',
  height: '12px',
  flexShrink: 0,
  borderRadius: '50%',
})

export const dot = styleVariants({
  success: [dotBase, { background: color.status.success }],
  warning: [dotBase, { background: color.status.warning }],
  danger: [dotBase, { background: color.status.danger }],
  muted: [dotBase, { background: color.text.disabled }],
})

const titleBase = style([typography.title.mdSemibold])

export const title = styleVariants({
  success: [titleBase, { color: color.text.primary }],
  warning: [titleBase, { color: color.text.primary }],
  danger: [titleBase, { color: color.status.danger }],
  muted: [titleBase, { color: color.text.secondary }],
})

export const hint = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const action = style([
  typography.button.smMedium,
  {
    marginLeft: 'auto',
    minHeight: '36px',
    padding: `0 ${spacing[16]}`,
    border: 'none',
    borderRadius: '999px',
    background: color.status.danger,
    color: color.text.inverse,
    cursor: 'pointer',
    transition: `filter ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { filter: 'brightness(0.92)' },
      '&:disabled': { cursor: 'not-allowed', opacity: 0.5 },
    },
  },
])

export const kpis = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: spacing[12],
  margin: 0,
})

export const kpi = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  padding: `${spacing[10]} ${spacing[14]}`,
  borderRadius: '10px',
  background: color.background.base,
})

export const kpiLabel = style([
  typography.body.caption,
  { color: color.text.secondary },
])

export const kpiValue = style([
  typography.title.lgSemibold,
  {
    margin: 0,
    fontWeight: fontWeight.bold,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const unit = style([
  typography.body.sub,
  { marginLeft: spacing[2], color: color.text.secondary },
])
