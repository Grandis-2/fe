import { keyframes, style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  spacing,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
  typography,
} from '@/shared/config/theme'

// 아래에서 살짝 올라오며 커진다 — 움직임은 작게 두고 opacity가 대부분을 맡는다.
const enter = keyframes({
  from: { opacity: 0, transform: 'translateY(12px) scale(0.96)' },
  to: { opacity: 1, transform: 'none' },
})

// 나갈 때는 들어올 때보다 짧고 덜 움직인다 — 이미 읽은 내용이라 시선을 끌 필요가 없다.
const leave = keyframes({
  from: { opacity: 1, transform: 'none' },
  to: { opacity: 0, transform: 'translateY(4px) scale(0.98)' },
})

// 움직임을 줄이라는 설정이면 위치 변화 없이 흐려지기만 한다. 애니메이션 자체를 끄면
// animationend가 안 와서 토스트가 사라지지 않으므로 opacity 전환은 남긴다.
const fade = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
const fadeOut = keyframes({ from: { opacity: 1 }, to: { opacity: 0 } })

export const viewport = style({
  position: 'fixed',
  left: '50%',
  bottom: spacing[40],
  transform: 'translateX(-50%)',
  // 모바일 탭바(zIndex 31)·바텀시트(30)보다 위에 뜬다.
  zIndex: 40,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[8],
  // 토스트가 없는 빈 영역이 아래 버튼 클릭을 막지 않게 한다.
  pointerEvents: 'none',
  '@media': {
    [breakpoint.mobile]: {
      bottom: `calc(${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET} + ${spacing[12]})`,
    },
  },
})

export const toast = style([
  typography.body.subMedium,
  {
    maxWidth: 'calc(100vw - 32px)',
    boxSizing: 'border-box',
    padding: `${spacing[12]} ${spacing[20]}`,
    borderRadius: '12px',
    background: color.backgroundDark.surface,
    color: color.text.inverse,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
    textAlign: 'center',
    wordBreak: 'keep-all',
    overflowWrap: 'break-word',
    animation: `${enter} ${motion.duration.normal} ${motion.easing.out} both`,
    '@media': {
      '(prefers-reduced-motion: reduce)': {
        animation: `${fade} ${motion.duration.normal} ${motion.easing.default} both`,
      },
    },
  },
])

export const toastLeaving = style([
  toast,
  {
    animation: `${leave} ${motion.duration.fast} ${motion.easing.default} both`,
    '@media': {
      '(prefers-reduced-motion: reduce)': {
        animation: `${fadeOut} ${motion.duration.fast} ${motion.easing.default} both`,
      },
    },
  },
])
