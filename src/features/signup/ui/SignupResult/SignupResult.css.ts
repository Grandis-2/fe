import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { color, onDark, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

const danger = `color-mix(in srgb, ${color.status.danger} 55%, white)`

const rise = keyframes({
  from: { opacity: 0, transform: 'translateY(20px)' },
  to: { opacity: 1, transform: 'none' },
})

// 화면에서의 세로 위치(궤도 중심 아래)는 페이지가 정한다(SignupPage.css의 result).
const base = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})

// 실패는 배경이 무너지는 연출을 조금 더 보여준 뒤 나타난다.
export const root = styleVariants({
  success: [
    base,
    { animation: `${rise} 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.9s both` },
  ],
  fail: [
    base,
    { animation: `${rise} 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 1.2s both` },
  ],
})

const eyebrowBase = style([
  typography.body.captionMedium,
  {
    marginBottom: '18px',
    letterSpacing: '0.32em',
    // 자간이 오른쪽에만 남아 가운데에서 밀리므로 왼쪽에도 같은 만큼 준다.
    paddingLeft: '0.32em',
  },
])

export const eyebrow = styleVariants({
  success: [eyebrowBase, { color: color.secondary.subtle }],
  fail: [eyebrowBase, { color: danger }],
})

export const title = style([
  typography.title.xxlSemibold,
  {
    margin: `0 0 ${spacing[14]}`,
    fontSize: '40px',
    fontWeight: fontWeight.bold,
    lineHeight: 1.2,
    wordBreak: 'keep-all',
    color: color.primary.subtler,
  },
])

export const failTitle = style([
  typography.title.xxlSemibold,
  {
    margin: `0 0 ${spacing[14]}`,
    fontWeight: fontWeight.bold,
    lineHeight: 1.3,
    wordBreak: 'keep-all',
    color: color.primary.subtler,
  },
])

export const highlight = style({
  background: `linear-gradient(120deg, ${color.primary.subtler} 0%, ${color.primary.subtle} 50%, ${color.secondary.subtle} 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
})

export const description = style([
  typography.body.defaultRegular,
  {
    marginBottom: '36px',
    lineHeight: 1.5,
    color: onDark(78),
    wordBreak: 'keep-all',
  },
])

export const actions = style({
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
})

// 폼의 완료 버튼 모양을 빌려 쓰되, 폼에서의 위 여백은 빼고 가로로 꽉 채운다.
export const primary = style({ alignSelf: 'stretch', marginTop: 0 })

export const secondary = style([
  typography.button.mdBold,
  {
    height: '54px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    border: `1px solid ${onDark(12)}`,
    background: onDark(3),
    color: onDark(78),
    textDecoration: 'none',
  },
])
