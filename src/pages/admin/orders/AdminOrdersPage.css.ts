import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

// 예약 현황과 같은 배치 — 왼쪽 제목, 오른쪽 마지막 갱신.
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

// 처리할 일 카드 — 좁으면 두 줄로 내려간다.
export const todo = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: spacing[12],
})

const todoCardBase = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: spacing[6],
  padding: `${spacing[16]} ${spacing[20]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  selectors: {
    '&:hover': { borderColor: color.primary.base },
    '&[aria-pressed="true"]': {
      borderColor: color.primary.base,
      boxShadow: `inset 0 0 0 1px ${color.primary.base}`,
    },
  },
})

export const todoCard = styleVariants({
  default: [todoCardBase],
  danger: [
    todoCardBase,
    {
      background: color.background.subtleDanger,
      borderColor: `color-mix(in srgb, ${color.status.danger} 30%, transparent)`,
    },
  ],
})

export const todoLabel = style([
  typography.body.subSemibold,
  { color: color.text.secondary },
])

export const todoValue = style([
  typography.title.lgSemibold,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

/** 건수를 못 받았을 때 — 0건과 헷갈리지 않게 흐리게 */
export const todoValueMuted = style([todoValue, { color: color.text.tertiary }])

export const todoHint = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// 왼쪽 상태 탭, 오른쪽 다른 상태·출처. 좁으면 줄을 바꾼다.
export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const dropdowns = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[12],
})

export const field = style({ width: '160px' })

// 칸 아래 오류 문구가 생겨도 버튼은 칸 높이에 맞춘다.
export const lookup = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[8],
  maxWidth: '480px',
})

// 고른 건수와 다음 단계 단추 — 표 바로 위에 붙어 무엇을 옮길지 보인다.
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

// 위 줄은 주된 값, 아래 줄은 함께 읽는 보조 값(주문 시각, 옵션·수량, 연락처, 다음 단계).
export const stacked = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: spacing[2],
})

export const mainText = style([
  typography.body.defaultMedium,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const cellText = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const number = style([
  typography.body.defaultRegular,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const subText = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const next = style([
  typography.body.caption,
  { color: color.primary.base, fontWeight: 600 },
])

export const navigator = style({
  alignSelf: 'center',
})
