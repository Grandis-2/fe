import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

const base = style([
  typography.body.sub,
  {
    width: '100%',
    border: `1px solid ${color.border.default}`,
    background: color.background.base,
    color: color.text.primary,
    // 세로로만 늘린다 — 가로로 늘어나면 폼 레이아웃이 깨진다.
    resize: 'vertical',
    boxSizing: 'border-box',
    transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&::placeholder': { color: color.text.tertiary },
      '&:focus-visible': {
        outline: 'none',
        borderColor: color.border.focus,
      },
      '&:disabled': {
        background: color.background.disabled,
        color: color.text.tertiary,
      },
    },
  },
])

// 높이는 size가 아니라 rows로 정한다 — 같은 크기에서도 필요한 줄 수가 다르다.
export const size = styleVariants({
  medium: [base, { padding: spacing[16], borderRadius: '12px' }],
  small: [base, { padding: spacing[12], borderRadius: '8px' }],
})
