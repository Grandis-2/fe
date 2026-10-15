import { keyframes, style } from '@vanilla-extract/css'

import {
  color,
  motion,
  shadow,
  spacing,
  typography,
} from '@shared/config/theme'

const menuEnter = keyframes({
  from: { opacity: 0, transform: 'translateY(-4px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

export const root = style({
  position: 'relative',
  display: 'inline-flex',
})

export const trigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  padding: 0,
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  color: color.text.secondary,
  cursor: 'pointer',
  transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover:not(:disabled), &[aria-expanded="true"]': {
      background: color.background.subSurface,
    },
    '&:disabled': {
      color: color.text.disabled,
      cursor: 'not-allowed',
    },
  },
})

export const triggerIcon = style({
  width: '20px',
  height: '20px',
})

export const menu = style({
  position: 'absolute',
  top: `calc(100% + ${spacing[4]})`,
  right: 0,
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  minWidth: '200px',
  padding: `${spacing[4]} 0`,
  background: color.background.base,
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  boxShadow: shadow.md,
  animation: `${menuEnter} ${motion.duration.fast} ${motion.easing.default}`,
})

export const item = style([
  typography.body.sub,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing[2],
    width: '100%',
    padding: `${spacing[8]} ${spacing[16]}`,
    border: 'none',
    background: 'transparent',
    color: color.text.primary,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    selectors: {
      '&:hover, &:focus-visible': {
        background: color.background.subSurface,
        outline: 'none',
      },
    },
  },
])

export const itemDanger = style({
  color: color.status.danger,
})

export const itemDisabled = style({
  color: color.text.disabled,
  cursor: 'not-allowed',
})

export const reason = style([
  typography.body.caption,
  {
    color: color.text.tertiary,
    whiteSpace: 'normal',
    maxWidth: '240px',
  },
])
