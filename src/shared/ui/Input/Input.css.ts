import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  width: '100%',
})

const boxBase = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  background: color.background.base,
  border: `1px solid ${color.primary.surface}`,
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:focus-within': {
      borderColor: color.primary.base,
    },
    // 읽기 전용 칸은 편집 가능한 칸과 구분되게 깐다.
    '&:has(input:read-only)': {
      background: color.background.surface,
    },
  },
})

export const box = styleVariants({
  medium: [
    boxBase,
    { height: '56px', borderRadius: '12px', padding: `0 ${spacing[16]}` },
  ],
  small: [
    boxBase,
    { height: '46px', borderRadius: '8px', padding: `0 ${spacing[12]}` },
  ],
})

export const boxError = style({
  borderColor: color.status.danger,
  background: color.background.subtleDanger,
  selectors: {
    '&:focus-within': {
      borderColor: color.status.danger,
    },
  },
})

const fieldBase = {
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: color.primary.focus,
  paddingTop: spacing[16],
}

export const field = styleVariants({
  medium: [typography.body.defaultRegular, fieldBase],
  small: [typography.body.sub, fieldBase],
})

export const fieldError = style({
  color: color.status.danger,
})

const labelBase = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  color: color.text.tertiary,
  pointerEvents: 'none',
  transition: `all ${motion.duration.fast} ${motion.easing.default}`,
} as const

export const label = styleVariants({
  medium: [
    typography.body.defaultRegular,
    {
      ...labelBase,
      left: spacing[16],
      selectors: {
        [`${field.medium}:focus ~ &, ${field.medium}:not(:placeholder-shown) ~ &`]:
          {
            top: spacing[8],
            transform: 'translateY(0)',
            fontSize: fontSize[12],
          },
      },
    },
  ],
  small: [
    typography.body.sub,
    {
      ...labelBase,
      left: spacing[12],
      selectors: {
        [`${field.small}:focus ~ &, ${field.small}:not(:placeholder-shown) ~ &`]:
          {
            top: spacing[8],
            transform: 'translateY(0)',
            fontSize: '9px',
          },
      },
    },
  ],
})

export const labelError = style({
  color: color.status.danger,
})

export const errorRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[4],
  color: color.status.danger,
})

export const errorIcon = styleVariants({
  medium: { width: '16px', height: '16px', flexShrink: 0 },
  small: { width: '13px', height: '13px', flexShrink: 0 },
})

export const errorText = styleVariants({
  medium: [typography.body.caption],
  small: [typography.body.caption, { fontSize: '10px' }],
})
