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
  // 안쪽의 absolute 요소(스크린리더용 표 등)가 이 스크롤 영역을 기준으로 놓이게 한다 — 없으면
  // 페이지 전체를 기준으로 놓여 문서가 길어지고 사이드바까지 함께 스크롤된다.
  position: 'relative',
  flex: '1 1 0%',
  minWidth: 0,
  overflowY: 'auto',
  padding: `${spacing[40]} ${spacing[80]} ${spacing[40]} ${spacing[40]}`,
})
