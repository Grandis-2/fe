import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[16],
  width: '400px',
  maxWidth: '100%',
  padding: `${spacing[32]} ${spacing[24]} ${spacing[24]}`,
  boxSizing: 'border-box',
})

// 한글은 기본값이면 글자 단위로 끊겨 단어 중간에서 줄이 바뀐다.
const wrapByWord = {
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
} as const

export const title = style([
  typography.title.mdSemibold,
  { color: color.text.primary, textAlign: 'center', ...wrapByWord },
])

export const description = style([
  typography.body.sub,
  { color: color.text.secondary, textAlign: 'center', ...wrapByWord },
])

export const field = style({
  width: '100%',
})

export const actions = style({
  display: 'flex',
  justifyContent: 'center',
  gap: spacing[8],
  marginTop: spacing[8],
})
