import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const tabLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[6],
})

export const tabCount = style({
  color: color.text.tertiary,
  fontVariantNumeric: 'tabular-nums',
})

// 처리 대기가 있으면 숫자를 빨갛게 — 평소 0이어야 하는 탭이다.
export const tabCountHot = style([tabCount, { color: color.status.danger }])

export const titleNote = style([
  typography.body.subMedium,
  { color: color.text.secondary },
])

export const selectionBar = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[8],
    padding: `${spacing[10]} ${spacing[16]}`,
    borderRadius: '10px',
    background: color.primary.subtler,
    color: color.primary.focus,
  },
])

export const selectionActions = style({
  display: 'flex',
  gap: spacing[8],
  marginLeft: 'auto',
})

export const stacked = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const inline = style({
  display: 'inline-flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[8],
})

export const strong = style({ fontWeight: fontWeight.semibold })

export const code = style([
  typography.body.caption,
  {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: color.text.tertiary,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
])

export const subText = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const link = style({
  color: color.primary.base,
  textDecoration: 'underline',
  fontVariantNumeric: 'tabular-nums',
})

export const subLink = style([
  typography.body.sub,
  { color: color.text.tertiary, textDecoration: 'underline' },
])
