import { style } from '@vanilla-extract/css'

import { spacing } from '@shared/config/theme'

// 라벨이 입력 위에 붙는 stacked 칸이라 버튼은 아래(입력 상자)에 맞춘다.
export const addressRow = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: spacing[10],
})

export const searchAction = style({ flexShrink: 0 })
