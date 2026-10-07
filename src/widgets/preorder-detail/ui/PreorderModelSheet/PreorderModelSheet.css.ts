import { globalStyle, style, styleVariants } from '@vanilla-extract/css'

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

// 공용 BottomSheet의 폭·위치는 그대로 두고 색만 어둡게 덮는다.
export const sheet = style({
  background: color.backgroundDark.surface,
  border: `1px solid ${onDark(10)}`,
  borderBottom: 'none',
  color: color.text.inverse,
  fontFamily: fontFamily.pretendard,
  lineHeight: lineHeight[140],
})

// 손잡이(BottomSheet가 맨 앞에 그리는 막대)도 어두운 시트에 맞춘다.
globalStyle(`${sheet} > :first-child`, { background: onDark(18) })

export const inner = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  // 내용도 시트 폭을 그대로 채운다.
  width: '100%',
  padding: `0 ${spacing[16]} ${spacing[16]}`,
  boxSizing: 'border-box',
  '@media': {
    [breakpoint.mobile]: { gap: spacing[20], padding: 0 },
  },
})

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const title = style({
  margin: 0,
  fontSize: fontSize[20],
  fontWeight: fontWeight.bold,
  '@media': { [breakpoint.mobile]: { fontSize: fontSize[18] } },
})

export const description = style({
  margin: 0,
  fontSize: fontSize[14],
  color: onDark(64),
})

export const models = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  '@media': { [breakpoint.mobile]: { gap: spacing[10] } },
})

export const action = style({ flexShrink: 0, whiteSpace: 'nowrap' })

const notifyBase = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[4],
  flexShrink: 0,
  height: '46px',
  padding: `0 ${spacing[16]}`,
  borderRadius: '999px',
  border: `1px solid ${color.primary.base}`,
  fontFamily: fontFamily.pretendard,
  fontSize: fontSize[14],
  fontWeight: fontWeight.bold,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: `background ${motion.duration.fast} ${motion.easing.default}`,
})

export const notify = styleVariants({
  off: [
    notifyBase,
    { background: color.primary.base, color: color.text.inverse },
  ],
  on: [notifyBase, { background: 'transparent', color: color.primary.subtle }],
})

// Button medium(46px)보다 크게 — 시트 맨 아래 손 닿기 쉬운 크기.
export const close = style({
  height: '52px',
  borderRadius: '14px',
  fontWeight: fontWeight.semibold,
})
