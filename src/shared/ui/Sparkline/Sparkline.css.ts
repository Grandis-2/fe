import { style } from '@vanilla-extract/css'

import { color } from '@shared/config/theme'

export const root = style({
  display: 'block',
  width: '100%',
  height: '32px',
})

export const line = style({
  stroke: color.primary.base,
  strokeWidth: 2,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
})

export const lineDanger = style([line, { stroke: color.status.danger }])
