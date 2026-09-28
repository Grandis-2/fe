import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const breadcrumb = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[4],
})

export const breadcrumbLink = style([
  typography.body.subMedium,
  {
    color: color.text.tertiary,
    textDecoration: 'none',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { color: color.primary.base, textDecoration: 'underline' },
    },
  },
])

export const breadcrumbIcon = style({
  width: '16px',
  height: '16px',
  color: color.text.tertiary,
})

export const breadcrumbCurrent = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

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
  background: color.background.surface,
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
  typography.body.sub,
  { color: color.text.tertiary },
])

export const summaryValue = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

export const actionsCard = style([
  card,
  { display: 'flex', flexDirection: 'column', gap: spacing[12] },
])

export const sectionTitle = style([
  typography.title.mdSemibold,
  { color: color.text.primary },
])

export const sectionDescription = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const actionButtons = style({
  display: 'flex',
  gap: spacing[8],
})

export const memoSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const memoRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[8],
})

export const textarea = style([
  typography.body.sub,
  {
    flex: 1,
    minHeight: '64px',
    padding: spacing[16],
    border: `1px solid ${color.border.default}`,
    borderRadius: '12px',
    background: color.background.surface,
    color: color.text.primary,
    resize: 'vertical',
    boxSizing: 'border-box',
    selectors: {
      '&::placeholder': { color: color.text.tertiary },
      '&:focus-visible': { outline: 'none', borderColor: color.border.focus },
    },
  },
])

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
