import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

const optionEnter = keyframes({
  from: { opacity: 0, transform: 'translateY(-4px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

export const root = style([
  typography.body.subMedium,
  {
    position: 'relative',
    width: '100%',
  },
])

export const box = style({
  display: 'flex',
  background: color.background.base,
  border: `1px solid ${color.border.default}`,
  overflow: 'hidden',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
})

export const size = styleVariants({
  medium: { borderRadius: '12px' },
  small: { borderRadius: '6px' },
})

export const boxOpen = style({
  borderColor: color.border.hover,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
})

export const menu = style({
  position: 'absolute',
  top: 'calc(100% - 1px)',
  left: 0,
  right: 0,
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  background: color.background.base,
  border: `1px solid ${color.border.hover}`,
  borderTop: 'none',
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  // 마지막 옵션까지 모서리가 잘리도록.
  overflow: 'hidden',
})

export const menuSize = styleVariants({
  medium: { borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' },
  small: { borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px' },
})

export const trigger = styleVariants({
  medium: [
    typography.body.subMedium,
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: `${spacing[8]} ${spacing[10]} ${spacing[8]} ${spacing[16]}`,
      color: color.primary.focus,
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      textAlign: 'left',
    },
  ],
  small: [
    typography.body.subMedium,
    {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'space-between',
      gap: '5px',
      padding: '5px 5px 5px 10px',
      color: color.primary.focus,
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      textAlign: 'left',
    },
  ],
})

export const triggerLabel = style({
  flex: '0 1 auto',
  minWidth: 0,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
})

export const triggerIcon = styleVariants({
  medium: {
    width: '24px',
    height: '24px',
    flexShrink: 0,
    color: color.text.tertiary,
  },
  small: {
    width: '18px',
    height: '18px',
    flexShrink: 0,
    color: color.text.tertiary,
  },
})

export const option = styleVariants({
  medium: [
    typography.body.sub,
    {
      display: 'flex',
      width: '100%',
      padding: `${spacing[8]} ${spacing[16]}`,
      color: color.text.secondary,
      background: color.background.base,
      border: 'none',
      textAlign: 'left',
      cursor: 'pointer',
      animation: `${optionEnter} ${motion.duration.fast} ${motion.easing.default}`,
      selectors: {
        '&:hover': {
          background: color.background.subSurface,
        },
      },
    },
  ],
  small: [
    typography.body.sub,
    {
      display: 'flex',
      width: '100%',
      padding: '5px 5px 5px 10px',
      color: color.text.secondary,
      background: color.background.base,
      border: 'none',
      textAlign: 'left',
      cursor: 'pointer',
      animation: `${optionEnter} ${motion.duration.fast} ${motion.easing.default}`,
      selectors: {
        '&:hover': {
          background: color.background.subSurface,
        },
      },
    },
  ],
})

export const optionSelected = style({
  background: color.primary.surface,
  color: color.primary.base,
  selectors: {
    '&:hover': {
      background: color.primary.surface,
    },
  },
})
