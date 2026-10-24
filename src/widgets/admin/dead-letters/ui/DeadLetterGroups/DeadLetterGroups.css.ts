import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
  gap: spacing[10],
})

export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  padding: `${spacing[14]} ${spacing[16]}`,
  borderRadius: '10px',
  border: `1px solid ${color.border.default}`,
})

export const text = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const title = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

// 색이 묶음의 성격을 말한다 — 빨강은 되돌릴 것, 주황은 배포 대기, 회색은 버릴 것.
export const count = styleVariants({
  PROCESSING_FAILED: { color: color.status.danger },
  UNKNOWN_EVENT_TYPE: { color: color.status.warning },
  UNREADABLE_BODY: { color: color.text.secondary },
})

export const description = style([
  typography.body.sub,
  { color: color.text.tertiary },
])
