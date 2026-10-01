import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
  marginBottom: spacing[30],
  padding: `0 ${spacing[8]}`,
})

export const titleRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing[12],
})

export const title = style([
  typography.title.xlSemibold,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    whiteSpace: 'nowrap',
  },
])

// 아이콘 크기를 글자 크기에 맞춘다.
export const chevron = style({
  width: '1em',
  height: '1em',
})

export const total = style([
  typography.body.sub,
  { color: color.text.tertiary, whiteSpace: 'nowrap' },
])

export const cardGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
  gap: spacing[24],
  paddingBottom: spacing[100],
})
