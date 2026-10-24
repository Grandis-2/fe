import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[6],
  flexShrink: 0,
  border: `1px solid ${color.border.default}`,
  borderRadius: '6px',
  background: color.background.base,
  color: color.text.secondary,
  cursor: 'pointer',
  transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { background: color.primary.subtler, color: color.primary.base },
  },
})

export const icon = style([base, { width: '28px', height: '28px', padding: 0 }])

export const withLabel = style([
  base,
  typography.body.subMedium,
  { minHeight: '36px', padding: `0 ${spacing[12]}`, borderRadius: '8px' },
])

export const glyph = style({ width: '14px', height: '14px' })
