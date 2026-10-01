import { style } from '@vanilla-extract/css'

import { color, spacing } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[16],
  padding: spacing[30],
  borderRadius: '16px',
  background: color.background.base,
  width: '402px',
})

export const headline = style({
  display: 'flex',
  alignItems: 'flex-start',
  width: '100%',
})

export const headlineText = style({
  flex: '1 0 0',
  color: color.text.primary,
  margin: 0,
})

export const headlineAccent = style({
  color: color.primary.base,
})

export const productName = style({ color: color.text.secondary, width: '100%' })

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[16],
  width: '100%',
  padding: `${spacing[16]} ${spacing[20]}`,
  borderRadius: '8px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

export const orderGroup = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
})

export const orderLabel = style({ color: color.secondary.focus })
export const orderNumber = style({ color: color.primary.base })

export const progressGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  alignItems: 'flex-start',
  width: '100%',
})

export const progressTrack = style({
  position: 'relative',
  width: '100%',
  height: '16px',
  borderRadius: '9999px',
  background: color.primary.surface,
})

export const progressFill = style({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  borderRadius: '9999px',
  background: color.primary.base,
})

export const progressMark = style({
  position: 'absolute',
  top: '50%',
  width: '16px',
  height: '16px',
  transform: 'translate(-50%, -50%) rotate(45deg)',
  color: color.text.inverse,
})

export const noticeText = style({
  color: color.text.tertiary,
  margin: '0 auto',
})

export const divider = style({
  width: '100%',
  height: '1px',
  background: color.border.subtle,
})

export const totalRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
})

export const totalLabel = style({ color: color.text.secondary })
export const totalValue = style({ color: color.secondary.base })
