import { style } from '@vanilla-extract/css'

import { color, spacing } from '@/shared/config/theme'

export const colorCell = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[8],
  color: color.text.primary,
})

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
