import { globalStyle, style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  onDark,
  spacing,
} from '@shared/config/theme'

export const root = style({
  display: 'flex',
  gap: spacing[8],
  '@media': {
    [breakpoint.mobile]: { gap: spacing[6] },
  },
  flexShrink: 0,
})

export const arrow = style({
  display: 'grid',
  placeItems: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  border: `1px solid ${onDark(18)}`,
  background: color.backgroundDark.surface,
  color: color.text.inverse,
  cursor: 'pointer',
  transition: [
    `opacity ${motion.duration.fast} ${motion.easing.default}`,
    `background ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:hover:not(:disabled)': { background: onDark(10) },
    '&:disabled': { opacity: 0.35, cursor: 'default' },
  },
  '@media': {
    // 모바일은 제목이 작아지는 만큼 버튼도 한 단계 줄인다.
    [breakpoint.mobile]: { width: '32px', height: '32px' },
  },
})

globalStyle(`${arrow} svg`, {
  '@media': {
    [breakpoint.mobile]: { width: '16px', height: '16px' },
  },
})
