import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const card = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: `${spacing[20]} ${spacing[24]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const lead = style([
  typography.body.defaultRegular,
  { color: color.text.primary },
])

export const note = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// 늘려 둔 상태 — 대기 인원이 부풀어 보인다는 대가를 빨간 글자로 알린다.
export const noteWarn = style([
  typography.body.sub,
  { color: color.status.danger },
])
