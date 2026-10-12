import { style } from '@vanilla-extract/css'

import { motion, spacing } from '@shared/config/theme'

// 폭·여백·제목은 shared/ui/Modal이 갖고 있다 — 여기선 오류 문구와 버튼만 쌓는다.
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

// 카카오 브랜드 가이드가 지정한 고정 색상이다 — 우리 디자인 토큰이 아니라 그대로 쓴다.
export const kakaoButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '48px',
  border: 'none',
  borderRadius: '12px',
  // eslint-disable-next-line no-restricted-syntax -- 카카오 브랜드 고정색
  background: '#FEE500',
  // eslint-disable-next-line no-restricted-syntax -- 카카오 브랜드 고정색
  color: '#191919',
  cursor: 'pointer',
  transition: `opacity ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { opacity: 0.85 },
  },
})
