import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  width: '280px',
  padding: spacing[16],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
  boxShadow: '0 8px 24px rgba(26, 26, 29, 0.12)',
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const monthLabel = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const navButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  padding: 0,
  border: 'none',
  borderRadius: '8px',
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

export const navIcon = style({
  width: '18px',
  height: '18px',
})

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '2px',
})

const weekdayBase = style([
  typography.body.caption,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '28px',
  },
])

export const weekday = styleVariants({
  weekday: [weekdayBase, { color: color.text.tertiary }],
  sunday: [weekdayBase, { color: color.status.danger }],
  saturday: [weekdayBase, { color: color.status.info }],
})

const dayBase = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '34px',
    padding: 0,
    border: '1px solid transparent',
    borderRadius: '8px',
    background: 'transparent',
    cursor: 'pointer',
    transition: [
      `background ${motion.duration.fast} ${motion.easing.default}`,
      `color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover': { background: color.primary.subtler },
    },
  },
])

export const day = styleVariants({
  weekday: [dayBase, { color: color.text.primary }],
  sunday: [dayBase, { color: color.status.danger }],
  saturday: [dayBase, { color: color.status.info }],
  outside: [dayBase, { color: color.text.disabled }],
})

// 오늘은 테두리로만 표시해서 선택 상태와 겹치지 않게 한다.
export const dayToday = style({
  borderColor: color.primary.base,
})

// 구간 선택에서 시작~끝 사이에 있는 날 — 양 끝은 daySelected가 진하게 칠한다.
// vanilla-extract는 같은 특이도면 뒤에 선언된 쪽이 이기므로, 두 클래스가 한
// 날에 겹쳐도 선택이 이기도록 daySelected보다 반드시 앞에 선언한다.
export const dayInRange = style({
  background: color.primary.subtler,
  borderRadius: 0,
})

export const daySelected = style({
  background: color.primary.base,
  color: color.text.inverse,
  selectors: {
    '&:hover': { background: color.primary.base },
  },
})
