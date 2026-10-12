import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

const divider = `1px solid ${color.border.subtle}`

export const filters = style({
  display: 'flex',
  gap: spacing[8],
})

const chipBase = style({
  height: '36px',
  padding: `0 ${spacing[16]}`,
  borderRadius: '18px',
  fontSize: fontSize[14],
  fontWeight: fontWeight.semibold,
  cursor: 'pointer',
  transition: [
    `color ${motion.duration.fast} ${motion.easing.default}`,
    `border-color ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
})

export const chip = styleVariants({
  active: [
    chipBase,
    {
      border: `1px solid ${color.primary.base}`,
      background: 'transparent',
      color: color.text.primary,
    },
  ],
  inactive: [
    chipBase,
    {
      border: divider,
      background: 'transparent',
      color: color.text.tertiary,
    },
  ],
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
