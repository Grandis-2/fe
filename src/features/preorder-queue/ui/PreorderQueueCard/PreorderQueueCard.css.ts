import { style } from '@vanilla-extract/css'

import { color, onDark, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

// 대기열 모달의 내용 — 테마와 상관없이 어두운 바탕이다.
export const root = style({
  width: '420px',
  maxWidth: '100%',
  padding: `${spacing[32]} 28px 28px`,
  boxSizing: 'border-box',
  background: color.backgroundDark.surface,
  color: onDark(92),
})

export const title = style([
  typography.title.lgSemibold,
  { fontSize: '22px', fontWeight: fontWeight.bold, letterSpacing: '-0.01em' },
])

export const productName = style([
  typography.body.sub,
  { marginTop: spacing[16], color: onDark(78) },
])

export const card = style({ marginTop: spacing[20] })
