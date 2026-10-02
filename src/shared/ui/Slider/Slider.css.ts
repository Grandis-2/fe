import { globalStyle, style } from '@vanilla-extract/css'

import { breakpoint, color, spacing } from '@shared/config/theme'

export const root = style({
  width: '100%',
  height: '100%',
})

globalStyle(`${root} .swiper-pagination`, {
  bottom: spacing[12],
})

globalStyle(`${root} .swiper-pagination-bullet`, {
  width: '6px',
  height: '6px',
  background: color.border.default,
  opacity: 1,
})

globalStyle(`${root} .swiper-pagination-bullet-active`, {
  background: color.border.hover,
})

// 화살표 — 이미지 위에 얹히는 흰 원형 버튼. Swiper 기본 크기/위치는 CSS 변수로 바꾼다.
globalStyle(root, {
  vars: {
    '--swiper-navigation-size': '40px',
    '--swiper-navigation-sides-offset': spacing[16],
  },
})

globalStyle(`${root} .swiper-button-prev, ${root} .swiper-button-next`, {
  boxSizing: 'border-box',
  borderRadius: '50%',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  color: color.text.primary,
  // 40px 원 안에서 화살표가 너무 커 보이지 않게 아이콘만 줄인다.
  padding: '12px',
  '@media': {
    [breakpoint.mobile]: { display: 'none' },
  },
})
