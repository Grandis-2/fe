import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

// 운영 대시보드의 제목 줄(topBar)과 같은 배치 — 왼쪽 제목, 오른쪽 마지막 갱신.
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

// 외부 등록 실패 건수 — 손볼 일이 있으면 빨간 배지로 띄운다.
export const tabCountDanger = style([
  typography.body.caption,
  {
    fontVariantNumeric: 'tabular-nums',
    padding: `1px ${spacing[6]}`,
    borderRadius: '9999px',
    background: color.status.danger,
    color: color.text.inverse,
  },
])

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

// 탭 아래 필터·정렬 줄 — 좁으면 줄을 바꾼다. 외부 예약 번호 칸이 가장 넓다.
export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

export const referenceField = style({ flex: '2 1 240px', minWidth: 0 })

export const field = style({ flex: '1 1 150px', minWidth: 0 })

// 위 줄은 주된 값, 아래 줄은 함께 읽는 보조 값(접수 시각, 옵션·차수, 남은 시간).
export const stacked = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const mainText = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

export const number = style({ fontVariantNumeric: 'tabular-nums' })

export const subText = style([
  typography.body.caption,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const dueSoon = style([
  typography.body.caption,
  { color: color.status.danger, fontWeight: 600 },
])

// 외부 등록 실패 행 — 태그만으로도 보이지만 표를 훑을 때 행 단위로 걸리게 옅게 깐다.
export const failedRow = style({
  background: `color-mix(in srgb, ${color.status.danger} 4%, ${color.background.base})`,
})
