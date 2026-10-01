import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const sectionLabel = style([
  typography.title.smMedium,
  { color: color.text.tertiary },
])

export const blockHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const colorBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  paddingBottom: spacing[12],
  borderBottom: `1px solid ${color.border.subtle}`,
  selectors: {
    '&:last-of-type': { borderBottom: 'none', paddingBottom: 0 },
  },
})

export const colorRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[10],
})

export const swatch = style({
  position: 'relative',
  flexShrink: 0,
  width: '20px',
  height: '20px',
  borderRadius: '9999px',
  border: `1px solid ${color.border.subtle}`,
  cursor: 'pointer',
  overflow: 'hidden',
})

// 아직 색을 고르지 않은 상태 — 회색 빈 원으로 보여준다.
export const swatchEmpty = style([
  swatch,
  {
    background: color.background.surface,
    borderStyle: 'dashed',
    borderColor: color.border.hover,
  },
])

export const swatchInput = style({
  position: 'absolute',
  inset: 0,
  opacity: 0,
  cursor: 'pointer',
})

export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
})

export const noColorLabel = style([
  typography.body.sub,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[6],
    flexShrink: 0,
    color: color.text.secondary,
    cursor: 'pointer',
  },
])

export const removeButton = style({
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
    '&:hover': { color: color.status.danger },
  },
})

export const removeIcon = style({
  width: '20px',
  height: '20px',
})

export const addButton = style([
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
      '&:hover:not(:disabled)': { background: color.primary.subtlerHover },
      '&:disabled': {
        background: color.background.surface,
        color: color.text.disabled,
        cursor: 'not-allowed',
      },
    },
  },
])

export const addIcon = style({
  width: '16px',
  height: '16px',
})
