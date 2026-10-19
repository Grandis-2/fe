import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const sectionHead = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: spacing[8],
})

// 세 덩어리(입장 속도 · 상품별 상한 · 자리 지켜 주기)가 같은 제목 글자를 쓴다.
export const sectionTitle = style([
  typography.title.mdSemibold,
  { margin: 0, color: color.text.primary },
])

export const caption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const alertRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
  width: '100%',
})

export const strong = style({ fontWeight: fontWeight.semibold })
