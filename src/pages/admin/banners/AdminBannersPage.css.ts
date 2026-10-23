import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
})

// 다른 관리자 화면(예약 현황·상품 관리)의 제목과 같은 크기다.
export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const bannerTitle = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

export const row = style({
  cursor: 'grab',
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${color.border.focus}`,
      outlineOffset: '-2px',
    },
  },
})

export const rowDragging = style({ opacity: 0.4 })

export const order = style({ fontVariantNumeric: 'tabular-nums' })

export const grip = style({
  display: 'block',
  width: '16px',
  height: '16px',
  margin: '0 auto',
  color: color.text.tertiary,
})

// 표의 수정(연필) 버튼과 같은 크기 — 지우기라 배경 없이 빨간 아이콘만 둔다.
export const deleteButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing[4],
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  color: color.status.danger,
  cursor: 'pointer',
  transition: `opacity ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { opacity: 0.7 },
    '&:focus-visible': {
      outline: `2px solid ${color.border.focus}`,
      outlineOffset: '2px',
    },
    '&:disabled': { color: color.text.disabled, cursor: 'not-allowed' },
  },
})

export const deleteIcon = style({
  width: '18px',
  height: '18px',
})
