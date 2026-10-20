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
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  margin: 0,
  padding: 0,
  listStyle: 'none',
  scrollbarWidth: 'none',
  selectors: { '&::-webkit-scrollbar': { display: 'none' } },
})

// 회차 하나가 작은 카드 — 줄로 나누지 않고 카드끼리 간격을 둔다. 왼쪽에 이름과 인원,
// 오른쪽 끝에 지금 단계 꼬리표를 세로 가운데로 맞춘다.
export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
  padding: `${spacing[14]} ${spacing[16]}`,
  borderRadius: '10px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

// 왼쪽 — 이름 아래에 응모·당첨 한 줄
export const info = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
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
