import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[20],
})

const TILE_SIZE = '156px'

export const preview = style({
  width: TILE_SIZE,
  height: TILE_SIZE,
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.subSurface,
  objectFit: 'cover',
  flexShrink: 0,
})

/** 아직 고르지 않았을 때 누르면 파일 선택이 열리는 자리 */
export const emptyTile = style([
  preview,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    color: color.text.tertiary,
    cursor: 'pointer',
    transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { borderColor: color.primary.base },
    },
  },
])

export const addIcon = style({
  width: '28px',
  height: '28px',
})

export const side = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  paddingTop: spacing[4],
})

export const guide = style([typography.body.sub, { color: color.text.primary }])

export const usage = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const actions = style({
  display: 'flex',
  gap: spacing[8],
  marginTop: spacing[4],
})

export const fileInput = style({
  display: 'none',
})
