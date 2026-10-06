import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import {
  color,
  motion,
  onDark,
  primaryGlow,
  primaryGradient,
  spacing,
  typography,
} from '@shared/config/theme'

const mix = (token: string, percent: number) =>
  `color-mix(in srgb, ${token} ${percent}%, transparent)`
// 어두운 바탕에서 읽히도록 위험 색에 흰색을 섞어 밝힌다.
const danger = `color-mix(in srgb, ${color.status.danger} 55%, white)`

// 아래에서 살짝 올라오며 나타난다.
const rise = keyframes({
  from: { opacity: 0, transform: 'translateY(16px)' },
  to: { opacity: 1, transform: 'none' },
})

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  animation: `${rise} 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})

// 회원가입·환영 화면이 같이 쓰는 머리글.
export const eyebrow = style([
  typography.body.captionMedium,
  {
    marginBottom: spacing[14],
    letterSpacing: '0.1em',
    color: color.secondary.subtle,
  },
])

export const title = style([
  typography.title.xxlSemibold,
  { margin: `0 0 ${spacing[10]}`, color: color.primary.subtler },
])

export const description = style([
  typography.body.defaultRegular,
  {
    marginBottom: spacing[32],
    lineHeight: 1.5,
    color: onDark(78),
    wordBreak: 'keep-all',
  },
])

// 1px 그라데이션 테두리 — 바깥 상자에 그라데이션을 깔고 안쪽 카드로 1px만 남긴다.
export const cardBorder = style({
  padding: '1px',
  borderRadius: '20px',
  background: `linear-gradient(140deg, ${mix(color.primary.subtle, 55)}, ${onDark(6)} 40%, ${onDark(4)} 60%, ${mix(color.secondary.subtle, 45)})`,
  boxShadow: `0 24px 60px rgba(0, 0, 0, 0.6), 0 0 80px ${mix(color.primary.base, 25)}`,
})

export const card = style({
  overflow: 'hidden',
  borderRadius: '19px',
  background: mix(color.backgroundDark.base, 72),
  backdropFilter: 'blur(18px) saturate(140%)',
  WebkitBackdropFilter: 'blur(18px) saturate(140%)',
})

export const row = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  padding: `${spacing[14]} ${spacing[20]} ${spacing[12]}`,
  borderBottom: `1px solid ${onDark(7)}`,
  cursor: 'text',
  transition: `background ${motion.duration.normal} ${motion.easing.default}`,
  selectors: {
    '&:last-child': { borderBottom: 'none' },
  },
})

export const rowFocused = style({
  background: mix(color.primary.subtle, 8),
})

const labelBase = style([
  typography.body.caption,
  {
    fontSize: '11px',
    letterSpacing: '0.08em',
    transition: `color ${motion.duration.normal} ${motion.easing.default}`,
  },
])

export const label = styleVariants({
  idle: [labelBase, { color: onDark(55) }],
  focused: [labelBase, { color: color.secondary.subtle }],
  invalid: [labelBase, { color: danger }],
})

export const input = style([
  typography.body.defaultRegular,
  {
    height: '26px',
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: color.text.inverse,
    selectors: {
      '&::placeholder': { color: onDark(40) },
    },
  },
])

export const error = style([
  typography.body.sub,
  { padding: `${spacing[10]} ${spacing[4]} 0`, color: danger },
])

export const submit = style([
  typography.button.mdBold,
  {
    marginTop: spacing[24],
    height: '54px',
    border: 'none',
    borderRadius: '14px',
    background: primaryGradient,
    color: color.text.inverse,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: primaryGlow,
    selectors: {
      '&:disabled': { opacity: 0.6, cursor: 'default' },
    },
  },
])
