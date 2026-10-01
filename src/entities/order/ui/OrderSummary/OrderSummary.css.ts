import { style } from '@vanilla-extract/css'

import { color, spacing } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  // gap: spacing[20],
  width: '100%',

  boxSizing: 'border-box',
  borderRadius: '16px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

export const title = style({
  color: color.text.primary,
  padding: `${spacing[24]} ${spacing[16]}`,
})

export const rows = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  padding: `0 ${spacing[16]} ${spacing[24]} ${spacing[16]}`,
})

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const rowLabel = style({ color: color.text.secondary })
export const rowValue = style({ color: color.text.primary })
export const rowValueHighlight = style({ color: color.primary.base })

export const totalRow = style([
  row,
  {
    padding: `${spacing[16]} ${spacing[20]}`,

    background: color.primary.surface,
    color: color.primary.base,
  },
])

// export const totalValue = style({ color: color.primary.focus })

export const actionRow = style({ padding: spacing[16] })

export const action = style({ width: '100%' })
