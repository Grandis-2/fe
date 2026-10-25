import { style } from '@vanilla-extract/css'

import { glowBackground, spacing } from '@shared/config/theme'

// 고객 사전예약 화면은 어두운 바탕 위에 흰 글자라, 모달의 흰 바탕 위에 같은 바탕을 깐다.
export const screen = style({
  padding: `${spacing[40]} ${spacing[24]} 0`,
  borderRadius: '12px',
  background: glowBackground,
})
