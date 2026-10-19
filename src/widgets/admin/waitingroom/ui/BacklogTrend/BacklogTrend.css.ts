import { style } from '@vanilla-extract/css'

import { color } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  color: 'inherit',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

// 늘고 있을 때만 칠한다 — 평소엔 회색 글자라 문제 있는 줄만 튀어 보인다.
export const rising = style([
  root,
  { color: color.status.danger, fontWeight: fontWeight.semibold },
])
