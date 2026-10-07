import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

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
  typography.body.sub,
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
  // 카드가 6장이라 좁은 화면에서 한 줄에 다 넣으면 숫자가 줄바꿈된다.
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: spacing[16],
})

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

/** Tag 아래에 사유·남은 시간 같은 보조 문구를 한 줄 더 붙이는 칸 */
export const stackedCell = style({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[4],
})

export const subText = style([
  typography.body.caption,
  { color: color.text.secondary },
])

export const dueText = style([
  typography.body.caption,
  { color: color.primary.base },
])

export const attemptText = style([
  typography.body.caption,
  { color: color.text.secondary },
])
