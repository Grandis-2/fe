import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

// 제목과 갱신 시각을 한 줄에 — 운영 대시보드와 같은 모양이다.
export const topBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
})

// 다른 관리자 화면(예약 현황·상품 관리)의 제목과 같은 크기다.
export const pageTitle = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

// 왼쪽은 자주 보고 바꾸는 것, 오른쪽 좁은 칸은 가끔 바꾸는 설정과 서버 상태.
export const columns = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 400px',
  alignItems: 'start',
  gap: spacing[20],
  '@media': {
    'screen and (max-width: 1100px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
})

export const main = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const side = style([main])
