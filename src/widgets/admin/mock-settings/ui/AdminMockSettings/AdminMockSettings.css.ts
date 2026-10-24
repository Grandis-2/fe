import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

// 지금 적용 중 — 카드 세 장과 바꿀 수 없는 참고 값 한 줄.
export const status = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const statusHead = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const statusTitle = style([
  typography.title.mdSemibold,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: `${spacing[4]} ${spacing[10]}`,
    margin: 0,
    color: color.text.primary,
  },
])

export const version = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const stats = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: spacing[12],
})

export const reference = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${spacing[6]} ${spacing[20]}`,
    color: color.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const strong = style({ color: color.text.primary, fontWeight: 600 })

/** 섹션 내용을 감싸는 흰 카드 */
export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: `${spacing[20]} ${spacing[24]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

// 되돌릴 수 없는 일만 모은 위험 구역 — 빨간 테두리로 다른 섹션과 떼어 놓는다.
export const dangerCard = style([
  card,
  {
    borderColor: `color-mix(in srgb, ${color.status.danger} 35%, transparent)`,
  },
])

export const faultFacts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

// 칸 아래 오류 문구가 생겨도 버튼은 칸 높이에 맞춘다.
export const faultRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  gap: spacing[12],
})

export const grow = style({ flex: '1 1 360px', minWidth: 0 })

export const faultButton = style({ flexShrink: 0 })

export const targets = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const targetsLabel = style([
  typography.body.subMedium,
  { color: color.text.secondary },
])

export const tags = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[6],
})

export const subText = style([
  typography.body.sub,
  { color: color.text.tertiary },
])
