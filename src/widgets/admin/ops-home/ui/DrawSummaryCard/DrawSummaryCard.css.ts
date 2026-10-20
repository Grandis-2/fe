import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

import { panel, panelHeader, panelLink, panelTitle } from '../panel.css'

// 카드 높이는 같은 줄의 다른 카드(할 일·주문)가 정한다 — 회차가 많아도 카드가 길어지지
// 않게 크기 계산에서 빠지고(contain: size), 넘치는 목록은 안에서 스크롤한다. 혼자 한
// 줄을 차지하는 좁은 화면에선 최소 높이만큼 보인다.
export const root = style([
  panel,
  {
    contain: 'size',
    minHeight: '280px',
  },
])
export const header = panelHeader
export const title = panelTitle
export const link = panelLink

// 스크롤은 되지만 막대는 숨긴다 — 카드가 깔끔하게 보이게.
export const list = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  margin: 0,
  padding: 0,
  listStyle: 'none',
  scrollbarWidth: 'none',
  selectors: { '&::-webkit-scrollbar': { display: 'none' } },
})

export const row = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  padding: `${spacing[14]} 0`,
  borderBottom: `1px solid ${color.border.subtle}`,
  selectors: {
    '&:first-child': { paddingTop: 0 },
    '&:last-child': { borderBottom: 'none', paddingBottom: 0 },
  },
})

export const rowHead = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: spacing[8],
})

export const name = style([
  typography.body.defaultMedium,
  {
    color: color.text.primary,
    textDecoration: 'none',
    selectors: { '&:hover': { textDecoration: 'underline' } },
  },
])

export const figure = style([
  typography.body.sub,
  {
    color: color.text.secondary,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
])

export const empty = style([
  typography.body.sub,
  { color: color.text.secondary },
])
