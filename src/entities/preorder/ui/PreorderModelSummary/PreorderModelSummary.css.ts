import { style } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'

export const root = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: spacing[12],
  padding: spacing[12],
  borderRadius: '16px',
  border: `1px solid ${color.border.default}`,
})

export const thumbnail = style({
  width: '70px',
  height: '70px',
  borderRadius: '12px',
  objectFit: 'cover',
})

export const thumbnailPlaceholder = style([
  thumbnail,
  { background: color.background.subSurface },
])

export const name = style({ color: color.text.primary })
export const opensAt = style({ color: color.text.tertiary })
