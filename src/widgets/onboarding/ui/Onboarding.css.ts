import { keyframes, style } from '@vanilla-extract/css'

import { motion } from '@shared/config/theme'
import { fontFamily } from '@shared/config/theme/tokens/typography/base'

import { palette } from '../model/palette'

// 시안이 860px을 경계로 배치를 바꾼다(그 아래에선 문구 칸 38vw에 56px 제목이 안 들어간다) —
// 프로젝트 breakpoint(744px)와 다른 값이라 여기서만 쓴다. Onboarding.tsx의 WIDE_MIN_WIDTH와 짝.
export const WIDE_QUERY = '(min-width: 860px)'
const sidePad = 'max(48px, 8vw)'
const columnWidth = 'min(460px, 38vw)'

const logoGradient = (mid: string) =>
  `linear-gradient(120deg, ${palette.ink} 0%, ${palette.ring} ${mid}, ${palette.accent} 100%)`

const gradientText = {
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
} as const

// 좁은 화면은 한 화면 안에서 스와이프로, 넓은 화면은 500vh를 스크롤하며 단계를 넘긴다.
export const scroller = style({
  position: 'relative',
  height: '100dvh',
  background: palette.bg,
  color: palette.ink,
  fontFamily: fontFamily.pretendard,
  '@media': { [WIDE_QUERY]: { height: '500vh' } },
})

export const frame = style({
  position: 'sticky',
  top: 0,
  height: '100dvh',
  overflow: 'hidden',
  background: palette.bg,
  // 세로 스크롤은 브라우저에 맡기고 가로 드래그만 스와이프로 받는다.
  touchAction: 'pan-y',
  userSelect: 'none',
  '@media': { [WIDE_QUERY]: { touchAction: 'auto', userSelect: 'auto' } },
})

export const canvas = style({
  position: 'absolute',
  inset: 0,
  display: 'block',
  width: '100%',
  height: '100%',
})

// 문구가 궤도 위에 얹혀도 읽히도록 문구 쪽만 바탕색으로 덮는다.
export const fade = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '420px',
  pointerEvents: 'none',
  background: `linear-gradient(to top, ${palette.bg} 0%, ${palette.bg} 55%, rgba(15,18,21,0.85) 72%, rgba(15,18,21,0) 100%)`,
  '@media': {
    [WIDE_QUERY]: {
      top: 0,
      height: 'auto',
      background: `linear-gradient(to right, ${palette.bg} 0%, rgba(15,18,21,0.9) 30%, rgba(15,18,21,0) 58%)`,
    },
  },
})

export const splash = style({
  position: 'absolute',
  inset: 0,
  zIndex: 5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  transition: 'opacity .8s ease',
})

// 서체·자간은 공용 Logo가 갖고, 여기선 크기와 그라데이션만 준다.
export const splashLogo = style({
  ...gradientText,
  fontSize: '52px',
  lineHeight: 1,
  // 마지막 글자 뒤에도 자간이 붙어 오른쪽으로 쏠려 보이는 만큼 왼쪽을 채워 가운데를 맞춘다.
  paddingLeft: '0.06em',
  backgroundImage: logoGradient('50%'),
  '@media': { [WIDE_QUERY]: { fontSize: '80px' } },
})

export const topBar = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '64px',
  padding: '0 20px 0 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  transition: 'opacity .6s ease .25s',
  '@media': {
    [WIDE_QUERY]: { height: '80px', padding: `0 ${sidePad}` },
  },
})

export const topLogo = style({
  ...gradientText,
  fontSize: '16px',
  backgroundImage: logoGradient('55%'),
  '@media': { [WIDE_QUERY]: { fontSize: '17px' } },
})

export const skip = style({
  minHeight: '44px',
  padding: '12px 8px',
  border: 0,
  background: 'transparent',
  color: palette.desc,
  fontFamily: fontFamily.pretendard,
  fontSize: '15px',
  cursor: 'pointer',
  transition: `transform ${motion.duration.slow} ${motion.easing.spring}, opacity .3s`,
  selectors: { '&:active': { transform: 'scale(.9)' } },
})

export const textBox = style({
  position: 'absolute',
  left: '28px',
  right: '28px',
  bottom: '132px',
  height: '210px',
  pointerEvents: 'none',
  '@media': {
    [WIDE_QUERY]: {
      left: sidePad,
      right: 'auto',
      width: columnWidth,
      top: '50%',
      bottom: 'auto',
      height: '300px',
      marginTop: '-170px',
    },
  },
})

export const block = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
})

export const kicker = style({
  marginBottom: '14px',
  fontSize: '13px',
  letterSpacing: '0.1em',
  color: palette.accent,
  '@media': { [WIDE_QUERY]: { marginBottom: '16px' } },
})

export const stepTitle = style({
  marginBottom: '14px',
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.25,
  '@media': {
    [WIDE_QUERY]: { marginBottom: '18px', fontSize: '56px', lineHeight: 1.2 },
  },
})

export const stepDescription = style({
  fontSize: '16px',
  lineHeight: 1.65,
  color: palette.desc,
  textWrap: 'pretty',
  wordBreak: 'keep-all',
  '@media': { [WIDE_QUERY]: { fontSize: '19px' } },
})

export const controls = style({
  position: 'absolute',
  left: '28px',
  right: '20px',
  bottom: '36px',
  height: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '24px',
  transition: 'opacity .6s ease .35s',
  '@media': {
    [WIDE_QUERY]: {
      left: sidePad,
      right: 'auto',
      width: columnWidth,
      bottom: 'calc(50% - 230px)',
    },
  },
})

export const pills = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
})

export const pill = style({
  height: '6px',
  borderRadius: '3px',
  background: palette.ink,
  transition: 'width .7s cubic-bezier(.3,1.9,.45,1), opacity .3s',
})

const nudge = keyframes({
  '0%, 100%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(6px)' },
})

// 스크롤로 넘기는 넓은 화면에서만 보인다.
export const hint = style({
  position: 'absolute',
  left: '50%',
  bottom: '28px',
  transform: 'translateX(-50%)',
  display: 'none',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  fontSize: '11px',
  letterSpacing: '0.12em',
  color: palette.hint,
  pointerEvents: 'none',
  transition: 'opacity .4s',
  '@media': { [WIDE_QUERY]: { display: 'flex' } },
})

export const hintArrow = style({
  animation: `${nudge} 1.6s ease-in-out infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})
