import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[8],
    color: color.text.secondary,
  },
])

// 아이콘만 든 네모 버튼 — 글자 줄 끝에 붙어 누를 곳이 한눈에 보인다.
export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '36px',
  height: '36px',
  padding: 0,
  borderRadius: '8px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  color: color.text.secondary,
  cursor: 'pointer',
  transition: [
    `background ${motion.duration.fast} ${motion.easing.default}`,
    `border-color ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:hover': {
      background: color.background.surface,
      borderColor: color.border.hover,
      color: color.text.primary,
    },
  },
})

export const icon = style({
  width: '16px',
  height: '16px',
})
