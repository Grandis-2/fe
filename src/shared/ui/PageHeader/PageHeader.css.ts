import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: `${spacing[12]} ${spacing[20]}`,
})

// 제목 덩어리가 줄어들어 설명이 접히고, 오른쪽 도구는 같은 줄에 남는다. 아주 좁을 때만
// 도구가 아래로 내려간다.
export const heading = style({
  flex: '1 1 200px',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  minWidth: 0,
})

export const titleLine = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[10],
})

// 다른 관리자 화면(예약 현황·상품 관리)의 제목과 같은 크기다.
export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const description = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const aside = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[8],
  flex: '0 1 auto',
  justifyContent: 'flex-end',
  marginLeft: 'auto',
})
