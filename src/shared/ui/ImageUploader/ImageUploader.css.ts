import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const label = style([
  typography.title.smMedium,
  { color: color.text.tertiary },
])

export const count = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const tiles = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

const tileBase = style({
  position: 'relative',
  boxSizing: 'border-box',
  flexShrink: 0,
  borderRadius: '8px',
  overflow: 'hidden',
})

export const tile = styleVariants({
  square: [tileBase, { width: '80px', height: '80px' }],
  portrait: [tileBase, { width: '80px', height: '160px' }],
})

export const thumbnail = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
})

export const removeButton = style({
  position: 'absolute',
  top: '4px',
  right: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  padding: 0,
  border: 'none',
  borderRadius: '9999px',
  background: 'rgba(26, 26, 29, 0.6)',
  color: color.text.inverse,
  cursor: 'pointer',
  // 타일 위에 올렸을 때만 드러내되, 키보드 포커스에서도 보이게 한다.
  opacity: 0,
  transition: `opacity ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    [`${tileBase}:hover &`]: { opacity: 1 },
    '&:focus-visible': { opacity: 1 },
  },
})

export const removeIcon = style({
  width: '12px',
  height: '12px',
})

const addTileBase = style({
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: '8px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: [
    `border-color ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
    `background ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:hover': {
      borderColor: color.primary.base,
      background: color.primary.subtler,
      color: color.primary.base,
    },
  },
})

export const addTile = styleVariants({
  square: [addTileBase, { width: '80px', height: '80px' }],
  portrait: [addTileBase, { width: '80px', height: '160px' }],
})

export const addIcon = style({
  width: '20px',
  height: '20px',
})

export const fileInput = style({
  display: 'none',
})
