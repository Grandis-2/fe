import { style } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // 헤더 아래 남은 높이 — 관리자 레이아웃(AdminLayout.css.ts)과 같은 값이다.
  minHeight: 'calc(100vh - 70px)',
  padding: spacing[16],
  background: color.background.base,
})
