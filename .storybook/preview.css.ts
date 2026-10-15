import { style } from '@vanilla-extract/css'

import { color, spacing } from '../src/shared/config/theme'

// parameters: { dark: true } 스토리의 바탕 — 사용자 페이지처럼 어두운 테마로 그린다.
export const darkCanvas = style({
  padding: spacing[24],
  background: color.background.page,
})
