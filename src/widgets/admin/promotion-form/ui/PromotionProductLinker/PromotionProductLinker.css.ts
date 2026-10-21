import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  listStyle: 'none',
  border: `1px solid ${color.border.default}`,
  borderRadius: '10px',
  overflow: 'hidden',
})

export const row = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
  alignItems: 'center',
  gap: spacing[12],
  padding: `${spacing[12]} ${spacing[16]}`,
  background: color.background.base,
  cursor: 'grab',
  selectors: {
    '& + &': { borderTop: `1px solid ${color.border.default}` },
    '&:focus-visible': {
      outline: `2px solid ${color.border.focus}`,
      outlineOffset: '-2px',
    },
  },
})

// 저장 전 새로 묶은 상품
export const rowNew = style({
  background: color.background.subtleWarning,
})

export const rowDragging = style({
  opacity: 0.5,
})

export const grip = style({
  width: spacing[16],
  height: spacing[16],
  color: color.text.tertiary,
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  minWidth: 0,
  textAlign: 'left',
})

export const name = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const meta = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

export const candidates = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const candidate = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  width: '100%',
  padding: `${spacing[12]} ${spacing[16]}`,
  border: `1px solid ${color.border.default}`,
  borderRadius: '10px',
  background: color.background.base,
  cursor: 'pointer',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { borderColor: color.border.hover },
  },
})

export const hint = style([typography.body.sub, { color: color.text.tertiary }])

export const empty = style([
  typography.body.sub,
  {
    padding: `${spacing[24]} ${spacing[16]}`,
    border: `1px dashed ${color.border.default}`,
    borderRadius: '10px',
    color: color.text.tertiary,
    textAlign: 'center',
  },
])

// 불러오는 동안의 줄 — 실제 줄과 같은 틀에 이름·오픈 일시 줄만 깐다.
export const skeletonRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  padding: `${spacing[12]} ${spacing[16]}`,
})
