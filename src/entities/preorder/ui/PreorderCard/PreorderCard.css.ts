import { style, styleVariants } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  onDark,
  spacing,
} from '@shared/config/theme'
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} from '@shared/config/theme/tokens/typography/base'

// 사진 위에 글자를 얹는 카드라 테마와 상관없이 어두운 바탕·흰 글자다.
export const root = style({
  position: 'relative',
  display: 'block',
  boxSizing: 'border-box',
  width: '100%',
  aspectRatio: '3 / 4',
  borderRadius: '16px',
  overflow: 'hidden',
  background: color.backgroundDark.surface,
  border: `1px solid ${onDark(10)}`,
  color: color.text.inverse,
  // 크기를 base 토큰으로 직접 정해서(typography 클래스 미사용) 글꼴도 직접 지정한다.
  fontFamily: fontFamily.pretendard,
  textDecoration: 'none',
  // 어두운 카드라 primary.base(#3F4891)로는 테두리가 거의 안 보여서 밝은 primary.subtle을 쓴다.
  transition: `border-color ${motion.duration.normal} ${motion.easing.default}`,
  selectors: {
    '&:hover': { borderColor: color.primary.subtle },
  },
  '@media': {
    [breakpoint.mobile]: { aspectRatio: '4 / 3' },
  },
})

// 마감된 사전예약은 흐리게 — 목록에선 보이지만 눈길은 진행 중인 것으로 간다.
export const status = styleVariants({
  live: {},
  soon: {},
  done: { opacity: 0.55 },
})

export const image = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
})

export const dday = style({
  position: 'absolute',
  top: spacing[16],
  left: spacing[16],
  padding: `5px ${spacing[10]}`,
  borderRadius: '8px',
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(8px)',
  fontSize: fontSize[14],
  fontWeight: fontWeight.bold,
  lineHeight: lineHeight[140],
  '@media': {
    [breakpoint.mobile]: {
      top: spacing[12],
      left: spacing[12],
      padding: `${spacing[4]} 9px`,
      fontSize: fontSize[12],
    },
  },
})

export const ddayColor = styleVariants({
  live: { color: color.text.inverse },
  soon: { color: color.primary.subtle },
  done: { color: onDark(55) },
})

export const body = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  padding: `64px ${spacing[24]} ${spacing[24]}`,
  background:
    'linear-gradient(to top, rgba(0, 0, 0, 0.92) 45%, rgba(0, 0, 0, 0))',
  lineHeight: lineHeight[140],
  '@media': {
    [breakpoint.mobile]: {
      gap: spacing[4],
      padding: `48px 18px 18px`,
    },
  },
})

export const title = style({
  fontSize: fontSize[20],
  fontWeight: fontWeight.bold,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  '@media': {
    [breakpoint.mobile]: { fontSize: fontSize[18] },
  },
})

export const benefit = style({
  fontSize: fontSize[14],
  color: onDark(90),
  '@media': {
    [breakpoint.mobile]: { fontSize: fontSize[12] },
  },
})

export const meta = style({
  fontSize: fontSize[12],
  color: onDark(64),
})
