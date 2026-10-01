import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  maxWidth: '420px',
  margin: '0 auto',
  padding: `${spacing[60]} 0`,
})

export const title = typography.title.xlSemibold

export const description = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const submit = style({ width: '100%' })
