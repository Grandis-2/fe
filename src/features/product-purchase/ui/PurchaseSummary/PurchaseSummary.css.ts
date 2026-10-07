import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

const divider = `1px solid ${color.border.subtle}`

export const root = style({
  display: 'none',
  '@media': {
    [breakpoint.desktop]: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing[14],
      padding: '28px',
      borderRadius: '20px',
      background: color.background.base,
      border: divider,
      color: color.text.primary,
    },
  },
})

export const selected = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  paddingBottom: spacing[20],
  borderBottom: divider,
})

export const selectedTitle = style([
  typography.body.subSemibold,
  { color: color.text.secondary },
])

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[6],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const chip = style([
  typography.body.subMedium,
  {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    height: '32px',
    padding: `0 ${spacing[12]}`,
    borderRadius: '8px',
    background: color.background.surface,
    border: `1px solid ${color.border.default}`,
  },
])

export const chipDot = style({
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  boxShadow: `inset 0 0 0 1px ${color.border.hover}`,
})

export const row = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    justifyContent: 'space-between',
    gap: spacing[8],
    color: color.text.secondary,
  },
])

export const accent = style({ color: color.primary.subtle })

export const total = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[8],
    marginTop: spacing[6],
  },
])

export const totalValue = style([
  typography.title.xlSemibold,
  { fontWeight: fontWeight.bold },
])

export const note = style([
  typography.body.defaultMedium,
  { textAlign: 'center', color: color.primary.subtle },
])
