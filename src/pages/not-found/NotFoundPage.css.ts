import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

// 결제 실패 화면(ResultPage의 failure)과 같은 결 — 행성 일러스트 + 워드마크로 가운데 모은다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[24],
  paddingTop: spacing[40],
  paddingBottom: spacing[40],
  textAlign: 'center',
})

export const illustration = style({
  color: color.secondary.subtle,
})

export const code = style([
  typography.logo.wordmark,
  { fontSize: fontSize[32], color: color.primary.focus },
])

export const texts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const title = style([
  typography.title.xlSemibold,
  { color: color.text.primary },
])

export const description = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])
