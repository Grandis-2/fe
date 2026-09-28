import { style, styleVariants } from '@vanilla-extract/css'

import { color, lineClamp, spacing } from '@/shared/config/theme'
import { fontSize } from '@/shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  gap: spacing[20],
  alignItems: 'center',
  width: '100%',
  padding: `0 ${spacing[20]}`,
  background: color.background.base,
})

export const thumbnail = style({
  width: '120px',
  height: '120px',
  borderRadius: '8px',
  background: color.background.surface,
  flexShrink: 0,
  objectFit: 'cover',
})

// 썸네일 높이만큼 늘려, 별점·본문은 위에 붙이고 상품명은 바닥에 붙인다.
export const main = style({
  display: 'flex',
  flex: '1 0 0',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignSelf: 'stretch',
  minWidth: 0,
  padding: `${spacing[8]} 0 ${spacing[12]}`,
})

export const top = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const rating = style({
  display: 'flex',
  fontSize: fontSize[20],
  lineHeight: 1,
})

export const star = styleVariants({
  filled: { color: color.primary.base },
  empty: { color: color.border.default },
})

export const reviewText = style([lineClamp(1), { color: color.text.primary }])

export const productName = style({ color: color.text.tertiary })

export const meta = style({
  display: 'flex',
  gap: spacing[30],
  alignItems: 'center',
  color: color.text.tertiary,
  flexShrink: 0,
})
