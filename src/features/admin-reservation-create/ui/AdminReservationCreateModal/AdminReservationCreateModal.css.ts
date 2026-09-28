import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  width: '480px',
  maxWidth: '100%',
  padding: spacing[24],
  boxSizing: 'border-box',
})

export const title = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

export const description = style([
  typography.body.sub,
  { color: color.text.secondary, marginTop: `-${spacing[8]}` },
])

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const fieldLabel = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

export const hint = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const optionRow = style({
  display: 'grid',
  // 라벨 폭을 고정해야 색상/용량 드롭다운의 왼쪽 선이 맞는다.
  gridTemplateColumns: '48px 1fr',
  alignItems: 'center',
  gap: spacing[12],
})

export const optionName = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const textarea = style([
  typography.body.sub,
  {
    minHeight: '88px',
    padding: spacing[12],
    border: `1px solid ${color.border.default}`,
    borderRadius: '8px',
    background: color.background.surface,
    color: color.text.primary,
    resize: 'vertical',
    boxSizing: 'border-box',
    selectors: {
      '&::placeholder': { color: color.text.tertiary },
      '&:focus-visible': {
        outline: 'none',
        borderColor: color.border.focus,
      },
    },
  },
])

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[8],
})
