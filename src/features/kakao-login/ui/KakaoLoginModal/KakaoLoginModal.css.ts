import { style } from '@vanilla-extract/css'

import { color, motion, spacing } from '@/shared/config/theme'

// 범용 chrome(테두리·배경·backdrop)은 shared/ui/Modal이 갖고 있다 — 여기선 이
// 모달만의 크기·여백만 얹는다.
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  // width: '320px',
  // maxWidth: '90vw',

  padding: spacing[24],
  boxSizing: 'border-box',
})

export const title = style({ color: color.text.primary, textAlign: 'center' })
export const description = style({ color: color.text.secondary })

// 카카오 브랜드 가이드가 지정한 고정 색상이다 — 우리 디자인 토큰이 아니라 그대로 쓴다.
export const kakaoButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '48px',
  border: 'none',
  borderRadius: '12px',
  background: '#FEE500',
  color: '#191919',
  cursor: 'pointer',
  transition: `opacity ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { opacity: 0.85 },
  },
})
