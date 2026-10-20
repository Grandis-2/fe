import { globalStyle, style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

import { panel, panelHeader, panelLink, panelTitle } from '../panel.css'

export const root = panel
export const header = panelHeader
export const title = panelTitle
export const link = panelLink

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
})

const cell = style({
  padding: `${spacing[10]} 0`,
  borderBottom: `1px solid ${color.border.subtle}`,
})

export const th = style([
  typography.body.captionMedium,
  cell,
  { textAlign: 'left', color: color.text.secondary },
])

export const thNum = style([th, { textAlign: 'right' }])

export const row = style({})

// 마지막 줄 아래엔 선을 긋지 않는다 — 카드 테두리와 겹친다.
globalStyle(`${row}:last-child > *`, { borderBottom: 'none' })

export const name = style([
  typography.body.subSemibold,
  cell,
  { textAlign: 'left', color: color.text.primary },
])

export const num = style([
  typography.body.sub,
  cell,
  {
    textAlign: 'right',
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const failures = style([
  num,
  typography.body.subSemibold,
  { color: color.status.danger },
])

export const empty = style([
  typography.body.sub,
  { color: color.text.secondary },
])
