import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'
import { fontWeight } from '@/shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  width: '300px',
  flexShrink: 0,
  overflowY: 'auto',
  padding: `${spacing[20]} 0`,
  background: color.background.base,
  borderRight: `1px solid ${color.border.default}`,
})

export const navList = style({
  display: 'flex',
  flexDirection: 'column',
})

export const navItem = style([
  typography.title.mdMedium,
  {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: `${spacing[12]} ${spacing[20]}`,
    borderLeft: '3px solid transparent',
    color: color.text.secondary,
    textDecoration: 'none',
    transition: [
      `background ${motion.duration.fast} ${motion.easing.default}`,
      `color ${motion.duration.fast} ${motion.easing.default}`,
      `border-left-color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover': {
        background: color.background.subSurface,
        color: color.text.primary,
      },
    },
  },
])

export const navItemActive = style({
  background: color.primary.subtler,
  borderLeftColor: color.primary.base,
  color: color.primary.base,
  fontWeight: fontWeight.medium,
  selectors: {
    '&:hover': {
      background: color.primary.subtler,
      color: color.primary.base,
    },
  },
})
