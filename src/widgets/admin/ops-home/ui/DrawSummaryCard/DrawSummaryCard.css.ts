import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

import { panel, panelHeader, panelLink, panelTitle } from '../panel.css'

export const root = panel
export const header = panelHeader
export const title = panelTitle
export const link = panelLink

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
})

export const row = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const rowHead = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const stuckRow = style([rowHead, { alignItems: 'center' }])

export const name = style([
  typography.body.subSemibold,
  {
    color: color.text.primary,
    textDecoration: 'none',
    selectors: { '&:hover': { textDecoration: 'underline' } },
  },
])

export const figure = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const track = style({
  height: '8px',
  borderRadius: '999px',
  background: color.background.subSurface,
  overflow: 'hidden',
})

export const bar = style({
  height: '100%',
  borderRadius: '999px',
  background: color.primary.base,
})

export const empty = style([
  typography.body.sub,
  { color: color.text.secondary },
])
