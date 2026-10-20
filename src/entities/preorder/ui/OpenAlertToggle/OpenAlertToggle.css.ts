import { style } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexShrink: 0,
  padding: spacing[4],
  border: 'none',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  selectors: {
    '&[aria-pressed="true"]': { color: color.primary.subtle },
  },
})
