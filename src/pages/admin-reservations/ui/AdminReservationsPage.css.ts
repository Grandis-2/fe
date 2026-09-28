import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
})

export const title = style([
  typography.title.xlSemibold,
  { color: color.text.primary },
])

export const refreshRow = style([
  typography.body.caption,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    color: color.text.tertiary,
  },
])

export const refreshButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[4],
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { color: color.primary.base },
  },
})

export const refreshIcon = style({
  width: '16px',
  height: '16px',
})

export const cards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: spacing[16],
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  padding: spacing[20],
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  background: color.background.surface,
})

export const cardLabel = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const cardValue = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

/** 조회 실패는 0건과 다르다 — 숫자 대신 이 문구를 쓴다 */
export const cardUnknown = style([
  typography.title.lgSemibold,
  { color: color.text.tertiary },
])

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: spacing[12],
})

export const controls = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
})

export const searchBox = style({
  width: '200px',
})

export const reservationNo = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

export const overdueMark = style([
  typography.body.caption,
  { color: color.status.danger },
])

export const rowLink = style({
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

export const rowLinkIcon = style({
  width: '18px',
  height: '18px',
})
