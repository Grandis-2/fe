import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 운영 대시보드 재처리 모달(ReprocessModal)과 같은 모양 — 건수 목록, 큰 숫자, 막대.
export const box = style({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: `${spacing[4]} ${spacing[14]}`,
  listStyle: 'none',
  borderRadius: '12px',
  background: color.background.surface,
})

export const boxTitle = style([
  typography.body.sub,
  { padding: `${spacing[10]} 0 ${spacing[4]}`, color: color.text.tertiary },
])

export const row = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    padding: `${spacing[8]} 0`,
    color: color.text.primary,
    selectors: {
      '& + &': { borderTop: `1px solid ${color.border.subtle}` },
    },
  },
])

export const value = style({
  margin: 0,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
})

export const dangerValue = style([value, { color: color.status.danger }])

export const orderLink = style([
  typography.body.subSemibold,
  { color: color.primary.base, fontVariantNumeric: 'tabular-nums' },
])

export const reason = style({ color: color.status.danger, textAlign: 'right' })

export const big = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: spacing[6],
  fontVariantNumeric: 'tabular-nums',
})

export const bigValue = style({
  fontSize: '40px',
  fontWeight: 700,
  lineHeight: 1.2,
  color: color.primary.base,
})

export const bigTotal = style([
  typography.title.mdSemibold,
  { color: color.text.tertiary },
])

export const progress = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

// 옮긴 만큼 남색, 못 옮긴 만큼 빨강을 이어 붙인다.
export const bar = style({
  display: 'flex',
  height: '8px',
  borderRadius: '9999px',
  background: color.background.subSurface,
  overflow: 'hidden',
})

export const barOk = style({
  height: '100%',
  background: color.primary.base,
  transition: 'width 0.2s linear',
})

export const barBad = style([barOk, { background: color.status.danger }])

export const progressMeta = style([
  typography.body.sub,
  {
    display: 'flex',
    justifyContent: 'space-between',
    gap: spacing[12],
    color: color.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const actions = style({
  display: 'flex',
  justifyContent: 'center',
  gap: spacing[8],
  marginTop: spacing[8],
})
