import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

// 폭·여백·제목은 shared/ui/Modal이 갖고 있다.
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const rating = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[4],
})

const starBase = style({
  width: '40px',
  height: '40px',
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontSize: '30px',
  lineHeight: 1,
  cursor: 'pointer',
  transition: [
    `color ${motion.duration.fast} ${motion.easing.default}`,
    `transform 160ms ${motion.easing.default}`,
  ].join(', '),
  selectors: { '&:active': { transform: 'scale(0.9)' } },
})

export const star = styleVariants({
  filled: [starBase, { color: color.status.warning }],
  empty: [starBase, { color: color.border.default }],
})

export const score = style([
  typography.body.defaultMedium,
  { marginLeft: spacing[8], color: color.text.secondary },
])

export const textField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

// 카드보다 한 단계 어둡게 파인 칸(결제 페이지 입력 칸과 같은 바탕). 높이는 고정한다.
export const textarea = style({
  background: color.background.page,
  resize: 'none',
})

export const counter = style([
  typography.body.caption,
  { alignSelf: 'flex-end', color: color.text.tertiary },
])
