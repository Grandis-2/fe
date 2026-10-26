import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

import {
  card as panel,
  head as panelHead,
  title as panelTitle,
} from '../panel.css'

export const card = panel
export const head = panelHead
export const title = panelTitle

export const status = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const list = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
})

// 한 건 — 무엇을 / 얼마에서 얼마로 / 언제·누가. 사이는 가는 선으로 나눈다.
export const item = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  padding: `${spacing[10]} 0`,
  selectors: {
    '& + &': { borderTop: `1px solid ${color.border.subtle}` },
  },
})

export const what = style([
  typography.body.subSemibold,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[6],
    color: color.text.primary,
  },
])

export const values = style([
  typography.body.defaultMedium,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const meta = style([
  typography.body.caption,
  { color: color.text.tertiary },
])
