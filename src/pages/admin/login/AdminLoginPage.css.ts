import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing } from '@shared/config/theme'

// 왼쪽 장면, 오른쪽 폼. 좁으면 장면이 위로 쌓인다. 헤더가 없어 화면을 다 쓴다(RootLayout).
export const root = style({
  display: 'flex',
  flexWrap: 'wrap',
  minHeight: '100vh',
  background: color.background.page,
})

export const formArea = style({
  flex: '1 1 480px',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: `${spacing[60]} ${spacing[24]}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '@media': {
    [breakpoint.mobile]: { padding: `${spacing[32]} ${spacing[16]}` },
  },
})
