import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const swatch = style({
  width: '20px',
  height: '20px',
  flexShrink: 0,
  borderRadius: '9999px',
  border: `1px solid ${color.border.subtle}`,
})

export const quantityField = style({
  width: '120px',
  margin: '0 auto',
})

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const bulk = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
})

export const bulkField = style({
  width: '200px',
})

export const group = style({
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const summary = style([
  typography.body.subMedium,
  {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[8],
    padding: spacing[16],
    cursor: 'pointer',
    listStyle: 'none',
    selectors: {
      '&::-webkit-details-marker': { display: 'none' },
    },
  },
])

export const chevron = style({
  width: '18px',
  height: '18px',
  flexShrink: 0,
  color: color.text.tertiary,
  transition: `transform ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    [`${group}[open] &`]: { transform: 'rotate(90deg)' },
  },
})

export const colorName = style({
  color: color.text.primary,
})

export const meta = style({
  color: color.text.tertiary,
})

export const warning = style({
  marginLeft: 'auto',
  color: color.status.warning,
})

export const groupBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  padding: `0 ${spacing[16]} ${spacing[16]}`,
})

export const groupActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: spacing[12],
})

export const groupToggle = style([
  typography.body.sub,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[8],
    marginLeft: 'auto',
    color: color.text.secondary,
  },
])
