import { style } from '@vanilla-extract/css'

import { color } from '@/shared/config/theme'

export const root = style({
  display: 'inline-flex',
  position: 'relative',
  width: '20px',
  height: '20px',
})

export const input = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  opacity: 0,
  cursor: 'pointer',
})

export const box = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '9999px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  pointerEvents: 'none',
  selectors: {
    [`${input}:hover ~ &`]: {
      background: color.primary.surface,
    },
    [`${input}:checked ~ &`]: {
      background: color.primary.base,
      borderColor: color.primary.base,
    },
  },
})

export const icon = style({
  width: '14px',
  height: '14px',
  color: color.text.inverse,
  opacity: 0,
  selectors: {
    [`${input}:checked ~ ${box} &`]: { opacity: 1 },
  },
})
