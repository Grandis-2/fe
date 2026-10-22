import { style } from '@vanilla-extract/css'

import { color, shadow, spacing, typography } from '@shared/config/theme'

// 밝은 바탕 위에 뜬 흰 카드.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  width: '100%',
  maxWidth: '400px',
  boxSizing: 'border-box',
  padding: `${spacing[40]} ${spacing[32]}`,
  borderRadius: '20px',
  background: color.background.base,
  border: `1px solid ${color.border.subtle}`,
  boxShadow: shadow.md,
})

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const eyebrow = style([
  typography.body.subSemibold,
  { color: color.primary.base, letterSpacing: '0.04em' },
])

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const lead = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const hint = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    paddingTop: spacing[16],
    borderTop: `1px solid ${color.border.subtle}`,
    color: color.text.tertiary,
  },
])

export const hintIcon = style({ width: '14px', height: '14px', flexShrink: 0 })
