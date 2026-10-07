import { style, styleVariants } from '@vanilla-extract/css'

import {
  color,
  motion,
  onDark,
  spacing,
  typography,
} from '@shared/config/theme'

import { cardBorder, list } from '../search.css'

export const preorders = style([
  list,
  { display: 'flex', flexDirection: 'column', gap: spacing[10] },
])

export const preorder = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[14],
  padding: `${spacing[14]} ${spacing[16]}`,
  borderRadius: '14px',
  background: color.backgroundDark.surface,
  border: cardBorder,
  color: 'inherit',
  textDecoration: 'none',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { borderColor: color.primary.base },
  },
})

export const status = styleVariants(
  { open: color.status.success, upcoming: color.primary.subtle },
  (statusColor) => [
    typography.body.captionMedium,
    {
      flexShrink: 0,
      padding: `3px ${spacing[8]}`,
      borderRadius: '6px',
      background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
      color: statusColor,
    },
  ],
)

export const title = style([
  typography.body.subSemibold,
  {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
])

export const chevron = style({
  flexShrink: 0,
  width: '18px',
  height: '18px',
  color: onDark(55),
})
