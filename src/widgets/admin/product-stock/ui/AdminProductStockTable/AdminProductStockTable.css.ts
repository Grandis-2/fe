import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

/** 합계 네 칸 — 좁으면 두 칸씩 */
export const tiles = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: spacing[12],
})

export const filterBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const filterLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[6],
})

export const filterCount = style({
  color: color.text.tertiary,
  fontVariantNumeric: 'tabular-nums',
})

export const note = style([typography.body.sub, { color: color.text.tertiary }])

export const option = style({
  display: 'inline-flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[8],
})

export const swatch = style({
  width: '14px',
  height: '14px',
  flexShrink: 0,
  borderRadius: '50%',
  border: `1px solid ${color.border.default}`,
  background: color.background.subSurface,
})

export const stock = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: spacing[10],
  fontVariantNumeric: 'tabular-nums',
})

/** 전체 대비 남은 수량 */
export const bar = style({
  width: '100px',
  height: '6px',
  borderRadius: '999px',
  background: color.background.subSurface,
  overflow: 'hidden',
})

const fillBase = style({
  display: 'block',
  height: '100%',
  borderRadius: '999px',
})

export const barFill = styleVariants({
  ok: [fillBase, { background: color.primary.base }],
  low: [fillBase, { background: color.status.warning }],
  out: [fillBase, { background: color.status.danger }],
  unregistered: [fillBase, { background: color.text.disabled }],
})
