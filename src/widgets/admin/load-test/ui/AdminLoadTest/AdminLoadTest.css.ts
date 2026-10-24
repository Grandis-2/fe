import { keyframes, style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spacing[12]} ${spacing[16]}`,
})

const badge = style([
  typography.body.subMedium,
  { display: 'inline-flex', alignItems: 'center', gap: spacing[6] },
])
export const liveBadge = style([badge, { color: color.status.success }])
export const recordingBadge = style([badge, { color: color.status.danger }])

const pulse = keyframes({ '50%': { opacity: 0.35 } })
const dot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  '@media': {
    '(prefers-reduced-motion: no-preference)': {
      animation: `${pulse} 1.6s ease-in-out infinite`,
    },
  },
})
export const liveDot = style([dot, { background: color.status.success }])
export const recordingDot = style([dot, { background: color.status.danger }])

export const kpis = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: spacing[12],
})

export const row = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: spacing[16],
})
export const wideCard = style({ flex: '3 1 520px' })
export const sideCard = style({ flex: '2 1 340px' })

export const caption = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const chartPair = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
  gap: spacing[24],
})

export const miniChart = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  minWidth: 0,
})

export const miniHeader = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[8],
    color: color.text.secondary,
  },
])

export const miniValue = style([
  typography.title.mdSemibold,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

// 실패 원인 표의 비율 막대
export const shareCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
  fontVariantNumeric: 'tabular-nums',
})

export const shareBar = style({
  flex: 1,
  height: '6px',
  borderRadius: '999px',
  background: color.background.subSurface,
  overflow: 'hidden',
})

export const shareFill = style({
  display: 'block',
  height: '100%',
  background: color.status.danger,
})

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[6],
})

export const checks = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${spacing[10]} ${spacing[32]}`,
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const check = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[10],
    color: color.text.primary,
  },
])

const checkMark = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '18px',
  height: '18px',
  borderRadius: '50%',
})
export const checkOk = style([
  checkMark,
  { background: color.background.subtleSuccess, color: color.status.success },
])
export const checkNo = style([
  checkMark,
  { background: color.background.subtleWarning, color: color.status.warning },
])

export const link = style([
  typography.body.subMedium,
  { color: color.primary.base, textDecoration: 'none' },
])

export const externalLink = style([
  typography.body.subMedium,
  { color: color.primary.base, textDecoration: 'underline' },
])
