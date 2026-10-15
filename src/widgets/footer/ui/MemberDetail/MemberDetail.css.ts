import { style } from '@vanilla-extract/css'

import { breakpoint, color, onDark, spacing } from '@shared/config/theme'
import {
  fontFamily,
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

import { fluid } from '../../lib/fluid'

const ease = 'cubic-bezier(.2,.8,.2,1)'
const hidden = '[data-visible="false"] &'

// 팀원이 바뀌어도 아래 영역이 출렁이지 않게 높이를 잡아 둔다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: fluid(14, 18),
  minHeight: '170px',
  transition: `opacity .3s ease, transform .45s ${ease}`,
  selectors: {
    '&[data-visible="false"]': { opacity: 0, transform: 'translateY(8px)' },
  },
  // 모바일은 한 줄로 쌓여 폭이 넉넉하다 — 시안 크기 그대로.
  '@media': { [breakpoint.mobile]: { gap: '18px' } },
})

export const identity = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const nameRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[10],
  transition: `opacity .35s ease .04s, transform .5s ${ease} .04s`,
  selectors: { [hidden]: { opacity: 0, transform: 'translateX(-12px)' } },
})

export const name = style({
  fontSize: fluid(20, 24),
  fontWeight: fontWeight.bold,
  letterSpacing: '-0.02em',
  lineHeight: 1.25,
  color: color.text.inverse,
  '@media': { [breakpoint.mobile]: { fontSize: fontSize[24] } },
})

export const githubLink = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '28px',
  height: '28px',
  color: color.text.inverse,
})

export const meta = style({
  fontSize: fluid(12, 13),
  color: onDark(45),
  '@media': { [breakpoint.mobile]: { fontSize: '13px' } },
})

export const work = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
})

export const workLabel = style({
  fontFamily: fontFamily.michroma,
  fontSize: '10px',
  letterSpacing: '0.2em',
  color: onDark(45),
})

export const features = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[6],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const feature = style({
  display: 'flex',
  alignItems: 'center',
  height: '28px',
  padding: `0 ${spacing[10]}`,
  borderRadius: '8px',
  border: `1px solid ${onDark(8)}`,
  background: color.backgroundDark.surface,
  fontSize: fontSize[12],
  color: onDark(90),
  transitionProperty: 'opacity, transform',
  transitionDuration: '.35s, .45s',
  transitionTimingFunction: `ease, ${ease}`,
  selectors: { [hidden]: { opacity: 0, transform: 'translateY(8px)' } },
})
