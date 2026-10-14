import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  onDark,
  spacing,
  typography,
} from '@shared/config/theme'

export const root = style({
  background: color.backgroundDark.base,
  borderTop: `1px solid ${onDark(8)}`,
})

// 헤더와 같은 좌우 여백(데스크톱 40px, 모바일 16px).
export const inner = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: `${spacing[40]} ${spacing[40]}`,
  '@media': {
    [breakpoint.mobile]: { padding: `${spacing[32]} ${spacing[16]}` },
  },
})

export const logo = style({
  alignSelf: 'flex-start',
  color: color.text.inverse,
  textDecoration: 'none',
})

export const links = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[20],
})

export const link = style([
  typography.body.sub,
  {
    color: onDark(55),
    textDecoration: 'none',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:hover': { color: color.text.inverse } },
  },
])

export const copyright = style([typography.body.caption, { color: onDark(40) }])
