import { style } from '@vanilla-extract/css'

import { color, typography } from '@shared/config/theme'

import {
  card as panel,
  head as panelHead,
  title as panelTitle,
} from '../panel.css'

export const card = panel
export const head = panelHead
export const title = panelTitle

export const note = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const noteBad = style([
  typography.body.sub,
  { color: color.status.danger },
])

export const release = style({ alignSelf: 'flex-start' })
