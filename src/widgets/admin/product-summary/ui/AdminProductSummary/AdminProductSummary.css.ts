import { style } from '@vanilla-extract/css'

import { spacing } from '@shared/config/theme'

// 네 칸이 한 줄에 서고, 좁으면 두 칸씩 내려간다.
export const root = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: spacing[12],
})
