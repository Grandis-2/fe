import { style } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: `${spacing[16]} ${spacing[20]}`,
  background: color.background.base,
  borderBottom: `1px solid ${color.primary.focus}`,
})

export const info = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

export const name = style({ color: color.text.primary })
export const options = style({ color: color.text.tertiary })

export const cta = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '47px',
  padding: `0 ${spacing[16]}`,
  borderRadius: '12px',
  border: 'none',
  background: color.primary.focus,
  color: color.text.inverse,
  cursor: 'pointer',
})
