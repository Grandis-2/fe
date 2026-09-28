import { style } from '@vanilla-extract/css'

import { color, spacing } from '@/shared/config/theme'
import { maxWidth } from '@/shared/config/theme/tokens/container'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
})

export const content = style({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  maxWidth: maxWidth.content,
  margin: '0 auto',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh',
  padding: spacing[16],
  background: color.background.base,
  borderTopLeftRadius: '16px',
  borderTopRightRadius: '16px',
})

export const handle = style({
  width: '40px',
  height: '4px',
  margin: `0 auto ${spacing[16]}`,
  borderRadius: '4px',
  background: color.border.default,
})
