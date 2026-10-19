import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const steps = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${spacing[8]} ${spacing[24]}`,
})

export const step = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    color: color.text.tertiary,
  },
])

export const stepReached = style({ color: color.text.primary })

export const stepNumber = style([
  typography.body.subMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: color.background.subSurface,
    color: color.text.secondary,
    selectors: {
      [`${stepReached} &`]: {
        background: color.primary.base,
        color: color.text.inverse,
      },
    },
  },
])

// 원인 고르기가 넓고 보내기가 좁다 — 좁은 화면에선 한 줄씩 쌓인다.
export const columns = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: spacing[16],
  // 나란한 카드는 높이를 맞춘다 — 윗선·아랫선이 어긋나면 서로 다른 덩어리로 읽힌다.
  alignItems: 'stretch',
})

/** 섹션 내용을 감싸는 흰 카드 */
export const card = style({
  minWidth: 0,
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const cause = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  minHeight: '44px',
  padding: `${spacing[12]} ${spacing[16]}`,
  borderRadius: '10px',
  border: `1px solid ${color.border.default}`,
  cursor: 'pointer',
})

export const causePicked = style({
  borderColor: color.primary.base,
  background: color.primary.subtler,
})

export const causeText = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const causeLabel = style([
  typography.title.smMedium,
  { color: color.text.primary },
])

export const causeHint = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// 다시 보내도 같은 원인 — 기본으로 빠져 있는 이유를 눈에 띄게.
export const causeHintWarn = style([
  typography.body.sub,
  { color: color.status.danger },
])

// 판매자에게는 설명이 먼저고, 코드는 개발팀에 알릴 때 쓰도록 흐리게 붙인다.
export const causeCode = style({ color: color.text.tertiary })

export const causeCount = style([
  typography.title.mdSemibold,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const summary = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  padding: `${spacing[12]} ${spacing[16]}`,
  borderRadius: '10px',
  background: color.background.surface,
})

export const summaryValue = style([
  typography.title.lgSemibold,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const cards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: spacing[16],
})

export const caption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const link = style({
  color: color.primary.base,
  textDecoration: 'underline',
})
