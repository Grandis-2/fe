import { style } from '@vanilla-extract/css'

import { color, spacing } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[32],
  width: '100%',
  // 상품 폼과 같은 폭 — 관리자 폼이 화면을 다 쓰면 한 줄이 너무 길어진다.
  maxWidth: '1000px',
})

/** 상세 이미지처럼 타일이 늘어서는 자리를 감싸는 테두리 */
export const tileFrame = style({
  padding: spacing[16],
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  background: color.background.base,
})

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[8],
  marginTop: spacing[16],
})
