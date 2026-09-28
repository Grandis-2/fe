import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  position: 'relative',
})

const triggerBase = style([
  typography.body.sub,
  {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    width: '100%',
    height: '46px',
    padding: `0 ${spacing[12]}`,
    borderRadius: '8px',
    border: `1px solid ${color.primary.surface}`,
    background: color.background.base,
    cursor: 'pointer',
    textAlign: 'left',
    transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { borderColor: color.primary.base },
    },
  },
])

export const trigger = style([triggerBase, { color: color.text.primary }])

export const triggerEmpty = style([triggerBase, { color: color.text.tertiary }])

export const icon = style({
  width: '18px',
  height: '18px',
  flexShrink: 0,
  color: color.text.tertiary,
})

export const text = style({
  flex: '1 1 0%',
  minWidth: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

// body에 포털로 붙으므로 화면 기준(fixed)으로 배치한다.
export const popover = style({
  position: 'fixed',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
  boxShadow: '0 8px 24px rgba(26, 26, 29, 0.12)',
  overflow: 'hidden',
})

// 팝오버가 카드 역할을 하므로 달력 자체의 테두리·그림자는 지운다.
export const calendar = style({
  border: 'none',
  borderRadius: 0,
  boxShadow: 'none',
})

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
  padding: `${spacing[10]} ${spacing[16]} ${spacing[16]}`,
})

export const hint = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const undecidedButton = style([
  typography.body.caption,
  {
    flexShrink: 0,
    padding: `${spacing[6]} ${spacing[10]}`,
    border: `1px solid ${color.border.default}`,
    borderRadius: '6px',
    background: 'transparent',
    color: color.text.secondary,
    cursor: 'pointer',
    transition: [
      `border-color ${motion.duration.fast} ${motion.easing.default}`,
      `color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover': {
        borderColor: color.primary.base,
        color: color.primary.base,
      },
    },
  },
])
