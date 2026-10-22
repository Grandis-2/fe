import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 예약 현황(AdminReservationsPage.css.ts)과 같은 배치·글씨 규칙.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

// 탭 이름 옆에 그 판매 방식의 상품 수를 붙인다.
export const tabLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[6],
})

export const tabCount = style({
  fontVariantNumeric: 'tabular-nums',
  opacity: 0.8,
})

// 탭 아래 검색·필터·정렬 줄 — 좁으면 줄을 바꾼다. 검색 칸이 가장 넓다.
export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

export const searchField = style({ flex: '2 1 260px', minWidth: 0 })

export const field = style({ flex: '1 1 150px', minWidth: 0 })

export const product = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  minWidth: 0,
})

export const thumbnail = style({
  flexShrink: 0,
  width: '44px',
  height: '44px',
  borderRadius: '8px',
  objectFit: 'cover',
  background: color.background.subSurface,
})

// 위 줄은 주된 값, 아래 줄은 함께 읽는 보조 값(브랜드·모델명, 정가·할인, 오픈·마감 시각).
export const stacked = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

// 표 글씨는 공통 Table 기본(14)보다 한 단계 크게 — 예약 현황과 같다.
export const mainText = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const number = style([
  typography.body.defaultRegular,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const subText = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const soldOut = style([
  typography.body.subSemibold,
  { color: color.status.danger },
])
