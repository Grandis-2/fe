import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  paddingTop: spacing[16],
  borderTop: `1px solid ${color.border.subtle}`,
})

export const row = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[12],
})

const spin = keyframes({ to: { transform: 'rotate(360deg)' } })

const iconBase = style({ flexShrink: 0, marginTop: spacing[2] })

// 처리 중이면 돈다 — 움직임 줄이기를 켠 사람에겐 돌지 않는다(색으로만 처리 중을 알린다).
export const icon = styleVariants({
  pending: [
    iconBase,
    {
      color: color.primary.base,
      animation: `${spin} 1s linear infinite`,
      '@media': {
        '(prefers-reduced-motion: reduce)': { animation: 'none' },
      },
    },
  ],
  success: [iconBase, { color: color.status.success }],
  left: [iconBase, { color: color.status.warning }],
  done: [iconBase, { color: color.text.tertiary }],
})

export const text = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const title = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const causes = style([
  typography.body.sub,
  { marginLeft: spacing[8], color: color.text.tertiary },
])

const statusBase = style([typography.body.sub])

export const status = styleVariants({
  pending: [statusBase, { color: color.primary.base }],
  success: [statusBase, { color: color.status.success }],
  left: [statusBase, { color: color.status.danger }],
  done: [statusBase, { color: color.text.secondary }],
})
