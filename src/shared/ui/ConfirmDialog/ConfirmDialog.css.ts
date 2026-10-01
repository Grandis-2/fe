import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[16],
  width: '360px',
  maxWidth: '100%',
  padding: `${spacing[32]} ${spacing[24]} ${spacing[24]}`,
  boxSizing: 'border-box',
})

export const title = style([
  typography.title.mdSemibold,
  { color: color.text.primary },
])

export const description = style([
  typography.body.sub,
  {
    color: color.text.secondary,
    textAlign: 'center',
    // 줄바꿈을 그대로 살린다 — 안내 문구는 문장 단위로 끊어 읽힌다.
    whiteSpace: 'pre-line',
  },
])

export const actions = style({
  display: 'flex',
  justifyContent: 'center',
  gap: spacing[8],
  marginTop: spacing[8],
})
