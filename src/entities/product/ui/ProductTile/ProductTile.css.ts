import { style } from '@vanilla-extract/css'

import { color, motion, onDark, skeleton, spacing } from '@shared/config/theme'

export const tile = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  padding: spacing[12],
  borderRadius: '14px',
  background: color.backgroundDark.surface,
  border: `1px solid ${onDark(10)}`,
  color: 'inherit',
  textDecoration: 'none',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&[href]:hover': { borderColor: color.primary.base },
  },
})

export const media = style({
  boxSizing: 'border-box',
  aspectRatio: '1.15',
  padding: spacing[8],
  borderRadius: '10px',
  overflow: 'hidden',
})

export const image = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

export const name = style({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
})

export const mediaSkeleton = style([skeleton])

export const lineSkeleton = style([
  skeleton,
  { height: '14px', borderRadius: '5px' },
])
