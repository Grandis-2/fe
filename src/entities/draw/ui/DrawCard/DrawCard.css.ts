import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, onDark, spacing } from '@shared/config/theme'
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} from '@shared/config/theme/tokens/typography/base'

// 어두운 사용자 페이지 전용 — 테마와 상관없이 어두운 바탕·흰 글자다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
  color: color.text.inverse,
  fontFamily: fontFamily.pretendard,
  lineHeight: lineHeight[140],
  textDecoration: 'none',
})

// 마감한 회차는 흐리게 — 목록에선 보이지만 눈길은 응모할 수 있는 것으로 간다.
export const phase = styleVariants({
  OPEN: {},
  SCHEDULED: {},
  CLOSED: { opacity: 0.55 },
})

export const thumb = style({
  position: 'relative',
  aspectRatio: '1',
  borderRadius: '16px',
  overflow: 'hidden',
  background: color.backgroundDark.surface,
  border: `1px solid ${onDark(10)}`,
  transition: `border-color ${motion.duration.normal} ${motion.easing.default}`,
  selectors: {
    [`${root}:hover &`]: { borderColor: color.primary.subtle },
  },
})

export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const badges = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
})

const badgeBase = style({
  padding: `${spacing[3]} ${spacing[8]}`,
  borderRadius: '6px',
  fontSize: fontSize[12],
  fontWeight: fontWeight.semibold,
})

export const badge = styleVariants({
  OPEN: [badgeBase, { background: onDark(8), color: onDark(90) }],
  SCHEDULED: [
    badgeBase,
    {
      background: `color-mix(in srgb, ${color.primary.subtle} 16%, transparent)`,
      color: color.primary.subtle,
    },
  ],
  CLOSED: [badgeBase, { background: onDark(8), color: onDark(64) }],
})

export const dday = styleVariants({
  normal: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    fontVariantNumeric: 'tabular-nums',
  },
  urgent: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    fontVariantNumeric: 'tabular-nums',
    color: color.status.warning,
  },
})

export const title = style({
  fontSize: fontSize[18],
  fontWeight: fontWeight.bold,
  textWrap: 'pretty',
})

export const meta = style({
  fontSize: fontSize[14],
  color: onDark(64),
})

export const fee = style({
  fontSize: fontSize[16],
  fontWeight: fontWeight.bold,
})
