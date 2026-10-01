import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  width: '100%',
})

export const navigator = style({
  alignSelf: 'center',
})

export const root = style({
  width: '100%',
  overflowX: 'auto',
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'auto',
})

const headerCellBase = style([
  typography.body.subMedium,
  {
    padding: `${spacing[14]} ${spacing[16]}`,
    color: color.text.secondary,
    background: color.background.subSurface,
    borderBottom: `1px solid ${color.border.subtle}`,
    whiteSpace: 'nowrap',
  },
])

export const headerCell = styleVariants({
  left: [headerCellBase, { textAlign: 'left' }],
  center: [headerCellBase, { textAlign: 'center' }],
  right: [headerCellBase, { textAlign: 'right' }],
})

export const row = style({
  transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:not(:last-child)': {
      borderBottom: `1px solid ${color.border.subtle}`,
    },
    '&:hover': {
      background: color.background.surface,
    },
  },
})

export const rowClickable = style({
  cursor: 'pointer',
})

const cellBase = style([
  typography.body.sub,
  {
    padding: `${spacing[14]} ${spacing[16]}`,
    color: color.text.secondary,
    verticalAlign: 'middle',
  },
])

export const cell = styleVariants({
  left: [cellBase, { textAlign: 'left' }],
  center: [cellBase, { textAlign: 'center' }],
  right: [cellBase, { textAlign: 'right' }],
})

export const emptyCell = style([
  typography.body.sub,
  {
    padding: `${spacing[40]} ${spacing[16]}`,
    color: color.text.tertiary,
    textAlign: 'center',
  },
])

// rowAction이 만드는 마지막 열의 > 버튼. 행 전체가 눌리는 경우에도
// 눈에 보이는 진입점을 남겨 둔다.
export const actionButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing[4],
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: [
    `background ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:hover': {
      background: color.background.subSurface,
      color: color.primary.base,
    },
  },
})

export const actionIcon = style({
  width: '18px',
  height: '18px',
})
