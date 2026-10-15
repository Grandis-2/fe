import { style } from '@vanilla-extract/css'

import { breakpoint, typography, spacing } from '@shared/config/theme'

export const title = style([
  typography.title.xlSemibold,
  {
    marginBottom: spacing[30],
    // ReviewCard의 좌우 padding과 맞춰 제목과 썸네일 왼쪽 선을 일치시킨다.
    padding: `0 ${spacing[20]}`,
    // 모바일은 헤더가 같은 제목을 띄운다(getMobileTitle).
    '@media': { [breakpoint.mobile]: { display: 'none' } },
  },
])

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  paddingBottom: spacing[100],
})
