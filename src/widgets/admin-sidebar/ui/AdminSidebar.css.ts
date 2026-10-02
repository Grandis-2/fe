import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'
import { fontWeight } from '@/shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  // 묶음 사이를 띄워야 바로 위 메뉴와 아래 묶음 이름이 한 덩어리로 안 읽힌다.
  gap: spacing[24],
  width: '300px',
  flexShrink: 0,
  overflowY: 'auto',
  padding: `${spacing[20]} 0`,
  background: color.background.base,
  borderRight: `1px solid ${color.border.default}`,
})

export const group = style({
  display: 'flex',
  flexDirection: 'column',
})

export const groupLabel = style([
  typography.body.sub,
  {
    boxSizing: 'border-box',
    padding: `${spacing[8]} ${spacing[40]}`,
    borderLeft: '3px solid transparent',
    color: color.text.tertiary,
  },
])

export const navItem = style([
  typography.title.mdMedium,
  {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: `${spacing[12]} ${spacing[40]}`,
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
