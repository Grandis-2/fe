import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

// 탭과 '수정하기' 버튼이 한 줄에 마주 본다.
export const tabRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
})

export const titleRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const notFound = style([
  typography.body.sub,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[12],
    padding: `${spacing[60]} ${spacing[20]}`,
    borderRadius: '12px',
    border: `1px solid ${color.border.subtle}`,
    background: color.background.base,
    color: color.text.tertiary,
  },
])

export const error = style([
  typography.body.sub,
  {
    padding: `${spacing[12]} ${spacing[16]}`,
    borderRadius: '8px',
    background: color.background.subtleDanger,
    color: color.status.danger,
  },
])
