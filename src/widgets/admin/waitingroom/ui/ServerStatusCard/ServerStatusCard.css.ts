import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

import {
  card as panel,
  head as panelHead,
  title as panelTitle,
} from '../panel.css'

export const card = style([panel, { gap: spacing[10] }])
export const head = panelHead
export const title = panelTitle

export const rows = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  margin: 0,
})

export const row = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const label = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const value = style([
  typography.body.defaultMedium,
  { fontWeight: fontWeight.semibold },
  { margin: 0, color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const valueBad = style([
  value,
  { color: color.status.danger, fontWeight: fontWeight.bold },
])

export const note = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const noteBad = style([
  typography.body.sub,
  { color: color.status.danger },
])
