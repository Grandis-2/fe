import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'

// 카드 배경(background.page)이 옅어서 글자는 text.primary로 두고, 구분선은 primary.subtle을 옅게 섞는다.
const divider = `1px solid color-mix(in srgb, ${color.primary.subtle} 40%, transparent)`

export const root = style({
  display: 'none',
  '@media': {
    [breakpoint.desktop]: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing[24],
      padding: spacing[30],
      borderRadius: '20px',
      background: color.background.page,
      color: color.text.primary,
    },
  },
})

export const title = style([typography.title.mdSemibold])

export const prices = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  paddingTop: spacing[24],
  borderTop: divider,
})

export const row = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
])

export const total = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
])

export const totalValue = style([typography.title.lgSemibold])

export const note = style([
  typography.body.defaultMedium,
  { textAlign: 'center', color: color.primary.base },
])
