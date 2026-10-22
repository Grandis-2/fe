import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

// 탭 이름 옆에 그 단계의 회차 수를 붙인다.
export const tabLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[6],
})

export const tabCount = style({
  fontVariantNumeric: 'tabular-nums',
  opacity: 0.8,
})

// 증정품 사진 옆에 제목과 증정품 이름 두 줄.
export const drawCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

export const thumb = style({
  flexShrink: 0,
  width: '44px',
  height: '44px',
  borderRadius: '8px',
  objectFit: 'cover',
  background: color.background.subSurface,
})

// 표 글씨는 예약 현황처럼 공통 Table 기본(14)보다 한 단계 크게 둔다.
export const stacked = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  minWidth: 0,
})

export const mainText = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const cellText = style([
  typography.body.defaultRegular,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const subText = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const subTextSoon = style([
  typography.body.subSemibold,
  { color: color.status.danger, fontVariantNumeric: 'tabular-nums' },
])
