import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const titleRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const notFound = style([
  typography.body.sub,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing[12],
    color: color.text.secondary,
  },
])

// 제목 줄 오른쪽 끝 — 링크 복사 · 고객 화면 보기
export const titleActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
  marginLeft: 'auto',
})

export const summary = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: spacing[12],
})

// 카드 값 아래 보조 줄(남은 날, 단계별 수)
export const stat = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
  fontVariantNumeric: 'tabular-nums',
})

export const statHint = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const statWarn = style([
  typography.body.subSemibold,
  { color: color.status.danger },
])
