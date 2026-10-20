import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

import { panel, panelHeader, panelLink, panelTitle } from '../panel.css'

export const root = panel
export const header = panelHeader
export const title = panelTitle
export const link = panelLink

export const steps = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: spacing[6],
})

export const stepItem = style({ minWidth: 0 })

export const step = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  padding: `${spacing[10]} ${spacing[12]}`,
  borderRadius: '10px',
  background: color.background.surface,
  color: color.text.primary,
  textDecoration: 'none',
  transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  selectors: { '&:hover': { background: color.background.subSurface } },
})

// 관리자가 다음 단계로 옮겨야 하는 단계(상품 준비·출고 대기)
export const stepAction = style([
  step,
  {
    background: color.primary.subtler,
    selectors: { '&:hover': { background: color.primary.subtlerHover } },
  },
])

export const count = style([
  typography.title.lgSemibold,
  { fontVariantNumeric: 'tabular-nums' },
])

export const label = style([
  typography.body.caption,
  {
    color: color.text.secondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
])

export const products = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[8],
    color: color.text.secondary,
  },
])

export const strong = style({ color: color.text.primary })
