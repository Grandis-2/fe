import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

// 조건과 떨어뜨려 조치 버튼임을 드러낸다.
export const bulkButton = style({
  marginLeft: 'auto',
})

export const stacked = style({
  display: 'inline-flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const subText = style([
  typography.body.caption,
  { color: color.text.tertiary },
])
