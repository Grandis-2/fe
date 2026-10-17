import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

const divider = `1px solid ${color.border.subtle}`

export const filters = style({
  display: 'flex',
  gap: spacing[8],
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '18px',
  border: divider,
  background: color.background.base,
  color: color.text.primary,
  textDecoration: 'none',
})

export const image = style({
  display: 'block',
  width: '100%',
  height: '180px',
  objectFit: 'cover',
  background: color.background.surface,
})

export const texts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  padding: spacing[16],
})

// Tag small(10px)은 카드 제목 옆에서 작다 — 12px로 키운다(HistoryCard 태그와 같음).
export const tag = style({
  alignSelf: 'flex-start',
  fontSize: fontSize[12],
  fontWeight: fontWeight.bold,
  padding: `${spacing[3]} ${spacing[8]}`,
})

export const title = style([
  typography.body.defaultMedium,
  { fontWeight: fontWeight.bold, textWrap: 'pretty' },
])

export const period = style([
  typography.body.sub,
  { color: color.text.tertiary },
])
