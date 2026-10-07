import { keyframes, style } from '@vanilla-extract/css'

import { color, motion, onDark, spacing } from '@shared/config/theme'

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

// ProductRanking과 같은 흐르는 빛 스켈레톤.
const shimmer = keyframes({
  '0%': { backgroundPosition: '100% 0' },
  '100%': { backgroundPosition: '-100% 0' },
})

export const skeleton = style({
  background: `linear-gradient(90deg, ${onDark(6)} 0%, ${onDark(6)} 35%, ${onDark(12)} 50%, ${onDark(6)} 65%, ${onDark(6)} 100%)`,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.4s linear infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})

export const lineSkeleton = style([
  skeleton,
  { height: '14px', borderRadius: '5px' },
])
