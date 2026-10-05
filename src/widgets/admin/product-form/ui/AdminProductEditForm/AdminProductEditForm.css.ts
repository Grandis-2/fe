import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

/** 불러오는 중·불러오기 실패 안내 */
export const message = style([
  typography.body.sub,
  {
    padding: `${spacing[60]} ${spacing[20]}`,
    textAlign: 'center',
    color: color.text.tertiary,
  },
])
