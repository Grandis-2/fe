import { style } from '@vanilla-extract/css'

import { spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

// 사전예약이 많아도 한 줄 — 가로로 넘기고(마우스로 끌기), 스크롤바는 숨긴다.
export const scope = style({
  display: 'flex',
  flexWrap: 'nowrap',
  alignItems: 'center',
  gap: spacing[6],
  overflowX: 'auto',
  scrollbarWidth: 'none',
  cursor: 'grab',
  userSelect: 'none',
  selectors: {
    '&::-webkit-scrollbar': { display: 'none' },
    '&:active': { cursor: 'grabbing' },
  },
})

// 칩이 줄어들거나 글자가 접히지 않게 한다.
export const scopeChip = style({ flexShrink: 0, whiteSpace: 'nowrap' })
