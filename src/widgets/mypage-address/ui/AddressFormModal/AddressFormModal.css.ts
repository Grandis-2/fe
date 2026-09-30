import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'
import { breakpoint } from '@/shared/config/theme/tokens/breakpoint'

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  width: '400px',
  maxWidth: '90vw',
  padding: spacing[24],
  boxSizing: 'border-box',
})

export const title = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

// 이름/휴대폰처럼 한 줄에 둘씩 놓이는 입력 — 모바일에선 한 칸씩 쌓인다(PaymentPage와 같은 패턴).
export const fieldRow = style({
  display: 'flex',
  gap: spacing[12],
  '@media': {
    [breakpoint.mobile]: { flexDirection: 'column' },
  },
})

export const postcodeRow = style([fieldRow, { alignItems: 'flex-start' }])

export const postcodeAction = style({
  flexShrink: 0,
  // Button medium은 46px인데 Input medium 상자는 56px이라 높이를 맞춰 준다.
  height: '56px',
  '@media': {
    [breakpoint.mobile]: { width: '100%' },
  },
})

export const submitButton = style({ marginTop: spacing[8] })
