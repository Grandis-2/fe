import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

const warningTint = (percent: number) =>
  `color-mix(in srgb, ${color.status.warning} ${percent}%, transparent)`

// 마감 카드는 경고색 유리 — 아래 단계 카드(중립)보다 먼저 눈에 걸린다.
export const deadline = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spacing[12]} ${spacing[24]}`,
  padding: '24px 28px',
  borderRadius: '20px',
  border: `1px solid ${warningTint(24)}`,
  background: warningTint(6),
})

export const deadlineTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const deadlineTitle = style([
  typography.body.subSemibold,
  { color: color.status.warning },
])

export const deadlineDate = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

// 초가 바뀔 때 숫자 폭이 흔들리지 않게 고정폭 숫자를 쓴다.
export const countdown = style({
  fontSize: fontSize[32],
  fontWeight: fontWeight.bold,
  letterSpacing: '0.02em',
  fontVariantNumeric: 'tabular-nums',
  color: color.text.primary,
})
