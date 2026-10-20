import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

import {
  card as panel,
  head as panelHead,
  title as panelTitle,
} from '../panel.css'

export const card = panel
export const head = panelHead
export const title = panelTitle

export const note = style([
  typography.body.caption,
  { color: color.text.secondary },
])

export const noteBad = style([
  typography.body.caption,
  { color: color.status.danger },
])

export const release = style([
  typography.button.smMedium,
  {
    alignSelf: 'flex-start',
    minHeight: '36px',
    padding: `0 ${spacing[16]}`,
    border: 'none',
    borderRadius: '999px',
    background: color.status.danger,
    color: color.text.inverse,
    cursor: 'pointer',
    transition: `filter ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { filter: 'brightness(0.92)' },
      '&:disabled': { cursor: 'not-allowed', opacity: 0.5 },
    },
  },
])
