import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  padding: spacing[16],
  borderRadius: '16px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

export const label = style({ color: color.text.primary })

export const recipient = style({ color: color.text.secondary })
export const fullAddress = style({ color: color.text.tertiary })

export const actionRow = style({
  display: 'flex',
  gap: spacing[12],
  marginTop: spacing[4],
})

export const action = style([
  typography.body.caption,
  {
    border: 'none',
    background: 'transparent',
    color: color.text.tertiary,
    cursor: 'pointer',
    padding: 0,
    transition: `opacity 160ms ${motion.easing.default}`,
    selectors: {
      '&:active': {
        opacity: 0.6,
      },
    },
  },
])
