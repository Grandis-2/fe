import { style } from '@vanilla-extract/css'

import { spacing } from '@shared/config/theme'

// 시간 초과 안내 아래에 [다시 확인]을 붙인다.
export const timeout = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: spacing[12],
})
