import { keyframes, style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

const spin = keyframes({ to: { transform: 'rotate(360deg)' } })

// 콜백 화면은 헤더·푸터 없이 뜨므로(MainLayout의 isCallbackPath) 화면 전체 높이의 가운데에 둔다.
export const root = style({
  minHeight: '100dvh',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[12],
  padding: spacing[24],
  textAlign: 'center',
})

export const spinner = style({
  color: color.primary.subtle,
  marginBottom: spacing[4],
  animation: `${spin} 0.9s linear infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})

export const title = style([
  typography.title.mdSemibold,
  { color: color.text.primary },
])

export const description = style([
  typography.body.sub,
  { color: color.text.secondary },
])
