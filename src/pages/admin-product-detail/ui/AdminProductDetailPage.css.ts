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

export const placeholder = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing[60]} ${spacing[20]}`,
    borderRadius: '12px',
    border: `1px solid ${color.border.subtle}`,
    background: color.background.base,
    color: color.text.tertiary,
  },
])

export const notFound = style([
  typography.body.sub,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[12],
    padding: `${spacing[60]} ${spacing[20]}`,
    borderRadius: '12px',
    border: `1px solid ${color.border.subtle}`,
    background: color.background.base,
    color: color.text.tertiary,
  },
])
