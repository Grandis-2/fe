import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

// 관리자 화면은 고른 범위가 한눈에 보여야 해서 고른 칩을 남색으로 채운다(사용자 칩은 옅은 테두리).
export const chip = style({
  selectors: {
    '&[aria-pressed="true"], &[aria-pressed="true"]:hover:not(:disabled)': {
      background: color.primary.base,
      borderColor: color.primary.base,
      color: color.text.inverse,
    },
  },
})

export const empty = style([
  typography.body.sub,
  { color: color.text.secondary },
])
