import { style } from '@vanilla-extract/css'

import { breakpoint, spacing } from '@shared/config/theme'

// 에러 문구가 입력 아래에 붙어도 버튼은 입력 상자 옆에 남아야 해서 위쪽 정렬이다.
// 모바일에선 한 칸씩 쌓인다.
export const postcodeRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[12],
  '@media': {
    [breakpoint.mobile]: { flexDirection: 'column' },
  },
})

export const postcodeAction = style({
  flexShrink: 0,
  // Button medium은 46px인데 Input medium 상자는 56px이라 높이를 맞춰 준다.
  height: '56px',
  '@media': {
    [breakpoint.mobile]: { width: '100%' },
  },
})
