import { style, styleVariants } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  onDark,
  spacing,
  statusOnDark,
  typography,
} from '@shared/config/theme'
import {
  fontFamily,
  fontSize,
} from '@shared/config/theme/tokens/typography/base'

// 시안의 좌우·아래 여백 — 화면 폭에 따라 20~72px, 32~56px.
const gutterX = `clamp(${spacing[20]}, 5.5vw, 72px)`

// 테마와 상관없이 늘 어두운 화면이다(온보딩과 같은 결) — 바탕은 backgroundDark, 글자는 흰색 계열.
// 높이는 놓이는 자리(페이지)가 정하고, 여기선 그 안을 채운다(flex: 1).
export const root = style({
  position: 'relative',
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  background: color.backgroundDark.base,
  color: color.text.inverse,
  wordBreak: 'keep-all',
})

export const scene = style({
  position: 'absolute',
  inset: 0,
})

// 아래쪽 절반을 바탕색으로 덮어 장면 위에서도 문구가 읽히게 한다.
export const fade = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '55%',
  background: `linear-gradient(0deg, ${color.backgroundDark.base} 18%, color-mix(in srgb, ${color.backgroundDark.base} 75%, transparent) 50%, transparent 100%)`,
  pointerEvents: 'none',
})

// 로고 글자에 남색 → 보라 그라데이션을 입힌다(온보딩 로고와 같은 색).
export const logo = style({
  position: 'relative',
  zIndex: 1,
  alignSelf: 'flex-start',
  margin: `${spacing[24]} ${gutterX}`,
  fontSize: fontSize[20],
  textDecoration: 'none',
  background: `linear-gradient(120deg, ${color.primary.subtler} 0%, ${color.primary.subtle} 55%, ${color.secondary.subtle} 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
})

// 장면이 보이도록 문구를 아래로 민다.
export const spacer = styleVariants({
  full: {
    flex: 1,
    // 모바일은 화면이 짧아 시안 여백대로면 버튼이 화면 밖으로 밀린다.
    minHeight: 'clamp(160px, 30vh, 320px)',
    '@media': {
      [breakpoint.desktop]: { minHeight: 'clamp(300px, 52vh, 620px)' },
    },
  },
  compact: { flex: 1, minHeight: '240px' },
})

export const body = style({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  maxWidth: `calc(440px + 2 * ${gutterX})`,
  padding: `0 ${gutterX} clamp(${spacing[32]}, 5vw, 56px)`,
  boxSizing: 'border-box',
})

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const code = style({
  fontFamily: fontFamily.michroma,
  fontSize: 'clamp(44px, 6vw, 72px)',
  lineHeight: 1,
  letterSpacing: '0.02em',
})

const labelBase = style({
  fontFamily: fontFamily.michroma,
  fontSize: '11px',
  letterSpacing: '0.24em',
})

export const label = styleVariants({
  brand: [labelBase, { color: color.primary.subtle }],
  danger: [labelBase, { color: statusOnDark.danger }],
})

export const texts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, textWrap: 'pretty' },
])

export const description = style([
  typography.body.defaultRegular,
  { color: onDark(64), textWrap: 'pretty' },
])

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})
