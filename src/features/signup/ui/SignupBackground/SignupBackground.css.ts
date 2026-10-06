import { style } from '@vanilla-extract/css'

import { color } from '@shared/config/theme'

const mix = (token: string, percent: number) =>
  `color-mix(in srgb, ${token} ${percent}%, transparent)`

// 화면에 고정된 맨 뒤 레이어(z-index -1) — 헤더·폼·탭바가 모두 위에 그려진다.
// 그래서 이 페이지에선 MainLayout이 바탕색을 칠하지 않는다(MainLayout.tsx).
export const root = style({
  position: 'fixed',
  inset: 0,
  zIndex: -1,
  pointerEvents: 'none',
  background: color.backgroundDark.base,
})

export const canvas = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  display: 'block',
})

// 왼쪽 위 남색, 오른쪽 보라, 아래 남색 빛.
export const glow = style({
  position: 'absolute',
  inset: 0,
  background: [
    `radial-gradient(ellipse 60% 45% at 15% 0%, ${mix(color.primary.base, 55)}, transparent 70%)`,
    `radial-gradient(ellipse 50% 40% at 95% 30%, ${mix(color.secondary.subtle, 22)}, transparent 70%)`,
    `radial-gradient(ellipse 80% 40% at 50% 110%, ${mix(color.primary.base, 35)}, transparent 70%)`,
  ].join(', '),
})
