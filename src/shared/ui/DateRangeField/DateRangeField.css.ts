import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

export const icon = style({
  width: '20px',
  height: '20px',
  color: color.text.tertiary,
  flexShrink: 0,
})

const triggerBase = style([
  typography.body.defaultRegular,
  {
    flex: 1,
    minWidth: 0,
    padding: `${spacing[12]} ${spacing[16]}`,
    border: `1px solid ${color.border.default}`,
    borderRadius: '8px',
    background: color.background.base,
    textAlign: 'center',
    cursor: 'pointer',
    transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { borderColor: color.border.hover },
      '&[aria-expanded="true"]': { borderColor: color.border.focus },
    },
  },
])

export const trigger = style([triggerBase, { color: color.text.primary }])

export const triggerEmpty = style([triggerBase, { color: color.text.tertiary }])

export const popover = style({
  // 부모의 overflow에 잘리지 않도록 body로 포털해서 띄운다.
  position: 'fixed',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const hint = style([
  typography.body.caption,
  {
    padding: `${spacing[8]} ${spacing[12]}`,
    borderRadius: '8px',
    background: color.background.surface,
    color: color.text.secondary,
    textAlign: 'center',
  },
])
