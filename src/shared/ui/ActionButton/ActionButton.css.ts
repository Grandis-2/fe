import { style, styleVariants } from '@vanilla-extract/css'

import {
  color,
  motion,
  onDark,
  primaryGlow,
  primaryGradient,
  statusOnDark,
  typography,
} from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

// 어두운 화면의 주요 행동 버튼(결제하기·장바구니) — 테마와 상관없이 흰 글자다.
export const root = style([
  typography.button.mdBold,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxSizing: 'border-box',
    padding: '0 22px',
    border: 'none',
    borderRadius: '14px',
    color: color.text.inverse,
    lineHeight: 1,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: `transform ${motion.duration.slow} ${motion.easing.spring}`,
    selectors: {
      '&:active:not(:disabled)': { transform: 'scale(0.97)' },
      '&:focus-visible': {
        outline: `2px solid ${color.primary.subtle}`,
        outlineOffset: '3px',
      },
      '&:disabled': { opacity: 0.6, cursor: 'default' },
    },
  },
])

export const icon = style({ width: '18px', height: '18px', flexShrink: 0 })

export const size = styleVariants({
  lg: { height: '52px' },
  md: { height: '44px', fontSize: '15px' },
})

export const fullWidth = style({ width: '100%' })

// 정사각형 — 폭을 높이(size)에 맞춘다.
export const iconOnly = style({ aspectRatio: '1', padding: 0 })

const cartGradient = (from: number, to: number) =>
  `linear-gradient(135deg, color-mix(in srgb, white ${from}%, ${color.backgroundDark.base}), color-mix(in srgb, white ${to}%, ${color.backgroundDark.base}))`

const neutral = {
  background: cartGradient(8, 15),
  boxShadow: `0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 ${onDark(10)}`,
  fontSize: '15px',
  fontWeight: fontWeight.semibold,
}

export const variant = styleVariants({
  primary: { background: primaryGradient, boxShadow: primaryGlow },
  cart: neutral,
  neutral,
})

// 장바구니에 담은 뒤 — 초록 유리.
export const added = style({
  background: `linear-gradient(135deg, color-mix(in srgb, ${statusOnDark.success} 12%, transparent), color-mix(in srgb, ${statusOnDark.success} 22%, transparent))`,
  color: statusOnDark.success,
})
