import { style } from '@vanilla-extract/css'

import { color, motion } from '@shared/config/theme'

export const root = style({
  display: 'inline-flex',
  position: 'relative',
  width: '40px',
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

export const track = style({
  position: 'absolute',
  inset: 0,
  borderRadius: '9999px',
  background: color.background.subSurface,
  pointerEvents: 'none',
  transition: `background-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    [`${input}:checked ~ &`]: {
      background: color.primary.subtle,
    },
  },
})

export const thumb = style({
  position: 'absolute',
  top: '2px',
  left: '2px',
  width: '16px',
  height: '16px',
  borderRadius: '9999px',
  background: color.background.base,
  transition: `left ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    [`${input}:checked ~ &`]: {
      left: '22px',
    },
  },
})
