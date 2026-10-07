import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  spacing,
  typography,
} from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'
import { headerHeight } from '@widgets/header'

const brandTint = (percent: number) =>
  `color-mix(in srgb, ${color.primary.subtle} ${percent}%, transparent)`

// 넓은 화면에선 220px 세로 메뉴가 스크롤을 따라온다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  minWidth: 0,
  '@media': {
    [breakpoint.desktop]: {
      flex: '0 0 220px',
      position: 'sticky',
      top: `calc(${headerHeight} + ${spacing[24]})`,
    },
  },
})

export const profile = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[14],
})

export const avatar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: brandTint(16),
  color: color.primary.subtle,
})

export const profileTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
  minWidth: 0,
})

export const userName = style([
  typography.body.defaultMedium,
  { fontSize: '17px', fontWeight: fontWeight.bold },
])

export const email = style([
  typography.body.sub,
  {
    overflow: 'hidden',
    color: color.text.tertiary,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
])

// 좁은 화면에선 가로 탭 — 넘치면 옆으로 스크롤한다.
export const nav = style({
  display: 'flex',
  gap: spacing[4],
  overflowX: 'auto',
  scrollbarWidth: 'none',
  '@media': {
    [breakpoint.desktop]: { flexDirection: 'column', overflowX: 'visible' },
  },
})

export const link = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    height: '44px',
    padding: `0 ${spacing[14]}`,
    border: 'none',
    borderRadius: '10px',
    background: 'transparent',
    color: color.text.tertiary,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: [
      `background-color ${motion.duration.fast} ${motion.easing.default}`,
      `color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover': {
        background: color.background.surface,
        color: color.text.primary,
      },
      // 지금 보고 있는 탭 — 굵기는 transition하지 않는다(폭이 흔들림).
      '&[aria-current="page"], &[aria-current="page"]:hover': {
        background: brandTint(16),
        color: color.text.primary,
        fontWeight: fontWeight.bold,
      },
    },
  },
])
