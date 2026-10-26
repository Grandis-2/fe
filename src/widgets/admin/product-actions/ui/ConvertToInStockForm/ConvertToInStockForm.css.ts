import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

// 옵션이 많으면(최대 500개) 창 안에서 넘겨 본다.
export const list = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  maxHeight: '320px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const row = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const name = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[6],
    minWidth: 0,
    paddingTop: spacing[8],
    color: color.text.primary,
  },
])

export const stock = style({ width: '120px', flexShrink: 0 })
