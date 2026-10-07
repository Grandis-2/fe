import { style, styleVariants } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  spacing,
  statusOnDark,
  typography,
} from '@shared/config/theme'

const divider = `1px solid ${color.border.subtle}`
const padX = {
  paddingInline: '28px',
  '@media': { [breakpoint.mobile]: { paddingInline: spacing[20] } },
}

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '20px',
  border: divider,
  background: color.background.base,
})

export const numberRow = style([
  padX,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    paddingBlock: spacing[20],
    borderBottom: divider,
  },
])

export const numberLabel = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const numberValue = style([
  typography.body.subSemibold,
  { letterSpacing: '0.02em', color: color.text.primary },
])

export const items = style([padX, { paddingBlock: spacing[8] }])

export const item = style({
  paddingBlock: spacing[14],
  selectors: { '& + &': { borderTop: divider } },
})

export const summary = style([
  padX,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[12],
    paddingBlock: `${spacing[20]} ${spacing[24]}`,
    borderTop: divider,
  },
])

export const row = style([
  typography.body.sub,
  { display: 'flex', justifyContent: 'space-between', gap: spacing[16] },
])

export const rowLabel = style({ flexShrink: 0, color: color.text.tertiary })

export const rowValue = styleVariants({
  default: { textAlign: 'right', color: color.text.primary },
  brand: { textAlign: 'right', color: color.primary.subtle },
  warning: { textAlign: 'right', color: color.status.warning },
  danger: { textAlign: 'right', color: statusOnDark.danger },
})

export const amountRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginTop: spacing[6],
  paddingTop: spacing[16],
  borderTop: divider,
})

export const amountLabel = typography.body.subSemibold

export const amountValue = styleVariants({
  paid: [typography.title.xlSemibold, { color: color.text.primary }],
  pending: [typography.title.xlSemibold, { color: color.primary.subtle }],
})
