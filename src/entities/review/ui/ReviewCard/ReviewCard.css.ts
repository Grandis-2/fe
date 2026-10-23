import { style, styleVariants } from '@vanilla-extract/css'

import { color, lineClamp, spacing } from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  boxSizing: 'border-box',
  display: 'flex',
  gap: spacing[20],
  alignItems: 'flex-start',
  width: '100%',
  padding: spacing[20],
  borderRadius: '16px',
  border: `1px solid ${color.border.subtle}`,
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

export const main = style({
  display: 'flex',
  flex: '1 0 0',
  flexDirection: 'column',
  gap: spacing[10],
  minWidth: 0,
})

// 별점(왼쪽)과 작성자·날짜(오른쪽) 한 줄 — 좁으면 작성자·날짜가 아래로 내려간다.
export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spacing[4]} ${spacing[12]}`,
})

export const rating = style({
  display: 'flex',
  fontSize: fontSize[20],
  lineHeight: 1,
})

// 리뷰 쓰기 모달(ReviewFormModal)의 별과 같은 색.
export const star = styleVariants({
  filled: { color: color.status.warning },
  empty: { color: color.border.default },
})

export const meta = style({ color: color.text.tertiary })

export const reviewText = style([
  lineClamp(3),
  { color: color.text.primary, whiteSpace: 'pre-line' },
])

export const productName = style({ color: color.text.tertiary })
