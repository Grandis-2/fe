import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid transparent',
  cursor: 'pointer',
  transition: [
    `background-color ${motion.duration.fast} ${motion.easing.default}`,
    `border-color ${motion.duration.fast} ${motion.easing.default}`,
    `opacity ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:disabled': {
      cursor: 'not-allowed',
      background: color.background.surface,
      borderColor: color.background.surface,
      color: color.text.disabled,
    },
  },
})

// line-height: 1 — 텍스트 타이포 토큰(line-height 130%)의 여유 공간이 위아래로 고르게
// 안 나뉘어서, 아이콘과 나란히 놓으면 텍스트가 아이콘 중심보다 미세하게(1px 미만) 위로
// 떠 보였다. 버튼 안에서만 줄간격을 줄여 글자 자체 높이에 맞춘다(공용 타이포 토큰은 안 건드림).
export const size = styleVariants({
  large: [
    base,
    typography.button.lgSemibold,
    {
      height: spacing[60],
      lineHeight: 1,
      gap: spacing[12],
      padding: `0 ${spacing[20]}`,
      borderRadius: '14px',
      borderWidth: '2px',
    },
  ],
  medium: [
    base,
    typography.body.defaultMedium,
    {
      height: '46px',
      lineHeight: 1,
      gap: spacing[10],
      padding: `0 ${spacing[16]}`,
      borderRadius: '12px',
      borderWidth: '1.5px',
    },
  ],
  small: [
    base,
    typography.button.smMedium,
    {
      height: '37px',
      lineHeight: 1,
      gap: spacing[6],
      padding: `0 ${spacing[12]}`,
      borderRadius: '10px',
      borderWidth: '1px',
    },
  ],
})

export const solid = styleVariants({
  primary: {
    background: color.primary.base,
    borderColor: color.primary.base,
    color: color.text.inverse,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.primary.focus,
        borderColor: color.primary.focus,
      },
    },
  },
  secondary: {
    background: color.secondary.base,
    borderColor: color.secondary.base,
    color: color.text.inverse,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.secondary.focus,
        borderColor: color.secondary.focus,
      },
    },
  },
  cancel: {
    background: color.background.subSurface,
    borderColor: color.background.subSurface,
    color: color.text.secondary,
    selectors: {
      '&:hover:not(:disabled)': {
        opacity: 0.85,
      },
    },
  },
  close: {
    background: color.close.base,
    borderColor: 'transparent',
    color: color.close.text,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.close.hover,
      },
    },
  },
})

export const subtle = styleVariants({
  primary: {
    background: color.primary.subtler,
    borderColor: color.primary.subtler,
    color: color.primary.base,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.primary.subtlerHover,
        borderColor: color.primary.subtlerHover,
      },
    },
  },
  secondary: {
    background: color.secondary.subtler,
    borderColor: color.secondary.subtler,
    color: color.secondary.base,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.secondary.subtlerHover,
        borderColor: color.secondary.subtlerHover,
      },
    },
  },
  cancel: {
    background: color.background.surface,
    borderColor: color.background.surface,
    color: color.text.secondary,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.background.subSurface,
        borderColor: color.background.subSurface,
      },
    },
  },
  close: {
    background: 'transparent',
    borderColor: 'transparent',
    color: color.close.text,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.close.base,
      },
    },
  },
})

export const outline = styleVariants({
  primary: {
    background: color.background.base,
    borderColor: color.primary.base,
    color: color.primary.base,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.primary.surface,
      },
    },
  },
  secondary: {
    background: color.background.base,
    borderColor: color.secondary.base,
    color: color.secondary.base,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.secondary.surface,
      },
    },
  },
  cancel: {
    background: color.background.base,
    borderColor: color.border.hover,
    color: color.text.secondary,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.background.subSurface,
      },
    },
  },
  close: {
    background: 'transparent',
    borderColor: color.close.hover,
    color: color.close.text,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.close.base,
      },
    },
  },
})

export const rounded = style({
  borderRadius: '9999px',
})

export const icon = style({
  display: 'inline-flex',
  flexShrink: 0,
})
