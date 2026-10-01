import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  padding: spacing[16],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const groupNameRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const valueRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
})

export const extraPriceField = style({
  width: '180px',
  flexShrink: 0,
})

export const iconButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '28px',
  height: '28px',
  padding: 0,
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { color: color.primary.base },
  },
})

export const icon = style({
  width: '20px',
  height: '20px',
})

export const addValueRow = style([
  // 문구 크기는 옵션 값 입력칸(small Input)과 동일하게 맞춘다.
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '46px',
    padding: `0 ${spacing[12]}`,
    borderRadius: '8px',
    border: `1px solid ${color.border.subtle}`,
    background: color.background.base,
    color: color.text.tertiary,
    cursor: 'pointer',
    transition: [
      `border-color ${motion.duration.fast} ${motion.easing.default}`,
      `color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover': {
        borderColor: color.primary.base,
        color: color.primary.focus,
      },
    },
  },
])

export const addGroupButton = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
    width: '100%',
    padding: spacing[10],
    border: 'none',
    borderRadius: '8px',
    background: color.primary.subtler,
    color: color.primary.base,
    cursor: 'pointer',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { background: color.primary.subtlerHover },
    },
  },
])
