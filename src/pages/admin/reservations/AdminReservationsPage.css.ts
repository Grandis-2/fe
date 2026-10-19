import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
})

export const title = style([
  typography.title.xlSemibold,
  { color: color.text.primary },
])

// 탭 이름 옆에 그 상태의 전체 건수를 붙인다.
export const tabLabel = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: spacing[6],
})

export const tabCount = style({
  fontVariantNumeric: 'tabular-nums',
  opacity: 0.8,
})

// 실패 경고 — 문구와 실패 탭으로 가는 단추를 한 줄에.
export const alertRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
  width: '100%',
})

// 고른 건수와 재처리 단추 — 표 바로 위에 붙어 무엇을 보낼지 보인다.
export const selectionBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
  padding: `${spacing[10]} ${spacing[16]}`,
  borderRadius: '10px',
  background: color.primary.subtler,
})

export const selectionCount = style([
  typography.body.defaultMedium,
  { color: color.primary.focus, fontVariantNumeric: 'tabular-nums' },
])

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: spacing[12],
})

export const controls = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
})

export const searchBox = style({
  width: '200px',
})

export const reservationNo = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

/** Tag 아래에 사유·남은 시간 같은 보조 문구를 한 줄 더 붙이는 칸 */
export const stackedCell = style({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[4],
})

export const subText = style([
  typography.body.caption,
  { color: color.text.secondary },
])

export const dueText = style([
  typography.body.caption,
  { color: color.primary.base },
])
