import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  paddingTop: spacing[16],
})

export const summary = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const card = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[16],
  width: '100%',
  padding: spacing[20],
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  background: color.background.base,
  textAlign: 'left',
  cursor: 'pointer',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { borderColor: color.border.hover },
  },
})

export const cardSelected = style({
  borderColor: color.primary.base,
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
  flex: 1,
  minWidth: 0,
})

export const name = style([
  typography.title.smMedium,
  { color: color.text.primary },
])

export const openAt = style([
  typography.body.sub,
  { color: color.primary.base, marginBottom: spacing[8] },
])

export const optionRow = style({
  display: 'flex',
  gap: spacing[12],
})

export const optionLabel = style([
  typography.body.subMedium,
  { width: '32px', flexShrink: 0, color: color.text.tertiary },
])

export const optionValues = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const empty = style([
  typography.body.sub,
  {
    padding: `${spacing[40]} ${spacing[16]}`,
    border: `1px dashed ${color.border.default}`,
    borderRadius: '12px',
    color: color.text.tertiary,
    textAlign: 'center',
  },
])
