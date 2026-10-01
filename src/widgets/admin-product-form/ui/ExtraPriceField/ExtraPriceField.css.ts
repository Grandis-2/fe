import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

// small Input과 같은 높이·라운드·패딩
export const root = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
  height: '46px',
  padding: `0 ${spacing[12]}`,
  borderRadius: '8px',
  border: `1px solid ${color.primary.surface}`,
  background: color.background.base,
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:focus-within': { borderColor: color.primary.base },
  },
})

export const affix = style([
  typography.body.sub,
  { flexShrink: 0, color: color.text.tertiary },
])

export const input = style([
  typography.body.sub,
  {
    flex: '1 1 0%',
    minWidth: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: color.text.primary,
    textAlign: 'left',
    selectors: {
      '&::placeholder': { color: color.text.disabled },
    },
  },
])
