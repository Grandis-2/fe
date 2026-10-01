import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const titleRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const card = style({
  padding: spacing[24],
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  background: color.background.base,
})

export const summaryGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: spacing[24],
})

export const summaryItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const summaryLabel = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])

export const summaryValue = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const actionsCard = style([
  card,
  { display: 'flex', flexDirection: 'column', gap: spacing[20] },
])

export const sectionTitle = style([
  typography.title.mdSemibold,
  { color: color.text.primary },
])

export const sectionDescription = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const actionButtons = style({
  display: 'flex',
  gap: spacing[8],
})

export const memoHeader = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing[8],
})

export const memoStatus = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const memoError = style([
  typography.body.caption,
  { color: color.status.danger },
])

export const memoSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const historySection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const notFound = style([
  typography.body.sub,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing[12],
    color: color.text.secondary,
  },
])
