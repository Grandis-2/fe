import { style } from '@vanilla-extract/css'

import {
  bleedScrollRow,
  breakpoint,
  color,
  motion,
  spacing,
} from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

// 어두운 구간에 놓이는 위젯이라 제목은 테마와 상관없이 흰 글자다. 바탕은 놓이는 자리가 정한다.
export const root = style({
  // 줄(row)의 bleedScrollRow가 이 폭을 cqw로 잰다.
  containerType: 'inline-size',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
})

export const title = style({
  margin: 0,
  minWidth: 0,
  '@media': {
    // 사전예약 제목(PreorderList)과 같은 모바일 크기.
    [breakpoint.mobile]: { fontSize: fontSize[20] },
  },
})

export const titleLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[2],
  color: color.text.inverse,
  textDecoration: 'none',
})

// 제목에 마우스를 올리면 화살표가 살짝 밀려 "누르면 이동"으로 읽힌다.
export const chevron = style({
  '@media': {
    [breakpoint.mobile]: { width: '18px', height: '18px' },
  },
  transition: `transform ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    [`${titleLink}:hover &`]: { transform: 'translateX(3px)' },
  },
})

export const row = style({
  ...bleedScrollRow(),
  gap: spacing[16],
  paddingBottom: spacing[4],
})

export const card = style({
  flex: '0 0 264px',
  scrollSnapAlign: 'start',
})
