import { style, styleVariants } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  onDark,
  spacing,
  typography,
} from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

// 어두운 사전예약 페이지 전용 — 테마와 상관없이 흰 글자(onDark)를 쓴다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[30],
  color: color.text.inverse,
  '@media': {
    [breakpoint.mobile]: { gap: spacing[16] },
  },
})

// 웹은 제목 옆에 탭, 모바일은 제목 아래에 탭.
export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[32],
  '@media': {
    [breakpoint.mobile]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: spacing[16],
    },
  },
})

export const title = style([
  typography.title.xxlSemibold,
  {
    margin: 0,
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[20] },
    },
  },
])

export const tabs = style({
  display: 'flex',
  gap: spacing[24],
  '@media': {
    [breakpoint.mobile]: { gap: spacing[8] },
  },
})

// 웹은 글자 탭, 모바일은 손가락으로 누르기 좋은 알약 버튼.
const tabBase = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[6],
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: onDark(55),
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: [
      `color ${motion.duration.fast} ${motion.easing.default}`,
      `background ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover': { color: onDark(90) },
    },
    '@media': {
      [breakpoint.mobile]: {
        height: '36px',
        padding: `0 ${spacing[14]}`,
        borderRadius: '18px',
        border: `1px solid ${onDark(18)}`,
        fontSize: fontSize[14],
      },
    },
  },
])

export const tab = styleVariants({
  active: [
    tabBase,
    {
      color: color.text.inverse,
      fontWeight: 700,
      selectors: { '&:hover': { color: color.text.inverse } },
      '@media': {
        [breakpoint.mobile]: {
          background: onDark(12),
          borderColor: 'transparent',
        },
      },
    },
  ],
  inactive: [tabBase],
})

export const count = style({
  color: color.primary.subtle,
  fontVariantNumeric: 'tabular-nums',
})

// 웹 3열, 모바일 1열(카드가 가로형 4:3으로 바뀐다).
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: spacing[20],
  '@media': {
    [breakpoint.mobile]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: spacing[14],
    },
  },
})
