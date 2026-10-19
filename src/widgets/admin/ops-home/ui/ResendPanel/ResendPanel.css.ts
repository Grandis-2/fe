import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

/** 실패 카드 아래 펼쳐지는 카드 */
export const card = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

// 보낼 양과 버튼을 한 줄에 — 무엇을 보낼지 고르는 목록은 그 아래에.
export const sendHeader = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const sendSummary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const sendCount = style([
  typography.title.mdSemibold,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const sendActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

export const scopeNote = style([
  typography.body.sub,
  {
    padding: `${spacing[10]} ${spacing[12]}`,
    borderRadius: '8px',
    background: color.background.surface,
    color: color.text.secondary,
  },
])

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const cause = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  padding: `${spacing[12]} ${spacing[16]}`,
  borderRadius: '10px',
  border: `1px solid ${color.border.default}`,
})

export const causePicked = style({
  borderColor: color.primary.base,
  background: color.primary.subtler,
})

export const causeLabelRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  minHeight: '32px',
  cursor: 'pointer',
})

export const causeText = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: `${spacing[2]} ${spacing[8]}`,
})

export const causeLabel = style([
  typography.title.smMedium,
  { color: color.text.primary },
])

// 판매자에게는 설명이 먼저고, 코드는 개발팀에 알릴 때 쓰도록 흐리게 붙인다.
export const causeCode = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const causeCount = style([
  typography.title.mdSemibold,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

// 다시 보내도 같은 원인 — 기본으로 빠져 있는 이유를 그 줄에 바로.
export const causeHintWarn = style([
  typography.body.sub,
  { paddingLeft: spacing[32], color: color.status.danger },
])

export const caption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const link = style({
  color: 'inherit',
  textDecoration: 'underline',
})
