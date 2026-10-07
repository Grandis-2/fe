import { style } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  alignItems: 'stretch',
  height: 'calc(100vh - 70px)',
  overflow: 'hidden',
  // 표·사이드바가 있는 데스크톱 도구라 이보다 좁으면 줄이지 않고 가로 스크롤한다.
  minWidth: '1024px',
  background: color.background.surface,
})

export const content = style({
  flex: '1 1 0%',
  minWidth: 0,
  overflowY: 'auto',
  padding: `${spacing[40]} ${spacing[80]} ${spacing[40]} ${spacing[40]}`,
})
