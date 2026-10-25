import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
  gap: spacing[10],
})

export const card = style({
  position: 'relative',
  display: 'flex',
  gap: spacing[12],
  padding: `${spacing[14]} ${spacing[16]}`,
  borderRadius: '10px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  cursor: 'pointer',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { borderColor: color.border.hover },
    // 고른 카드는 테두리를 두 겹으로 — 색만이 아니라 굵기로도 구분된다.
    '&:has(input:checked)': {
      borderColor: color.primary.base,
      boxShadow: `inset 0 0 0 1px ${color.primary.base}`,
      background: color.primary.subtler,
    },
    '&:has(input:focus-visible)': {
      outline: `2px solid ${color.border.focus}`,
      outlineOffset: '2px',
    },
  },
})

// 카드 전체가 눌리는 자리 — 진짜 radio는 보이지 않게 덮어 둔다.
export const input = style({
  position: 'absolute',
  inset: 0,
  margin: 0,
  opacity: 0,
  cursor: 'pointer',
})

export const dot = style({
  flexShrink: 0,
  width: '18px',
  height: '18px',
  marginTop: '2px',
  boxSizing: 'border-box',
  borderRadius: '50%',
  border: `2px solid ${color.border.hover}`,
  background: color.background.base,
  selectors: {
    [`${card}:has(input:checked) &`]: {
      border: `6px solid ${color.primary.base}`,
    },
  },
})

export const text = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
  minWidth: 0,
})

export const label = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const description = style([
  typography.body.sub,
  { color: color.text.secondary },
])
