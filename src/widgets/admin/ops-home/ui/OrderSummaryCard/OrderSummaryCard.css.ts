import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

import { panel, panelHeader, panelLink, panelTitle } from '../panel.css'

export const root = panel
export const header = panelHeader
export const title = panelTitle
export const link = panelLink

const plainList = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
} as const

// ── 처리할 단계: 줄마다 큰 건수 · 이름과 안내 · 처리 버튼 ─────────

export const todos = style({
  ...plainList,
  display: 'flex',
  flexDirection: 'column',
})

export const todo = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  padding: `${spacing[10]} 0`,
  borderBottom: `1px solid ${color.border.subtle}`,
  selectors: {
    '&:first-child': { paddingTop: 0 },
    '&:last-child': { borderBottom: 'none' },
  },
})

export const todoCount = style([
  typography.title.lgSemibold,
  {
    minWidth: '52px',
    color: color.primary.base,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const todoText = style({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
})

export const todoLabel = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const todoHint = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const todoAction = style([
  typography.button.smMedium,
  {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '36px',
    padding: `0 ${spacing[14]}`,
    borderRadius: '9999px',
    border: `1px solid ${color.border.default}`,
    background: color.background.base,
    color: color.text.primary,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:hover': { background: color.background.surface } },
  },
])

// ── 그 밖의 단계: 알약 한 줄 ──────────────────────────────────

export const chips = style({
  ...plainList,
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

export const chip = style([
  typography.body.sub,
  {
    display: 'inline-flex',
    gap: spacing[4],
    padding: `${spacing[4]} ${spacing[10]}`,
    borderRadius: '9999px',
    background: color.background.surface,
    color: color.text.secondary,
    textDecoration: 'none',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:hover': { background: color.background.subSurface } },
  },
])

// ── 상품 판매 상태 ───────────────────────────────────────────

export const products = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[8],
    paddingTop: spacing[12],
    borderTop: `1px solid ${color.border.subtle}`,
    color: color.text.secondary,
  },
])

export const strong = style({
  color: color.text.primary,
  fontVariantNumeric: 'tabular-nums',
})
