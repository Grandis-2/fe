import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

// 남색은 정상, 빨강은 실패, 주황은 느림·주의 — 운영 화면의 상태 색과 같다.
const toneColor = {
  primary: color.primary.base,
  danger: color.status.danger,
  warning: color.status.warning,
  neutral: color.text.tertiary,
}

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
})

export const bar = style({
  display: 'flex',
  height: '14px',
  borderRadius: '9999px',
  overflow: 'hidden',
  background: color.background.subSurface,
})

export const fill = styleVariants(toneColor, (background) => ({
  height: '100%',
  background,
  transition: `width ${motion.duration.fast} ${motion.easing.default}`,
}))

export const legend = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const item = style([
  typography.body.defaultRegular,
  {
    display: 'grid',
    gridTemplateColumns: '12px minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: spacing[10],
    color: color.text.primary,
  },
])

export const swatch = styleVariants(toneColor, (background) => ({
  width: '12px',
  height: '12px',
  borderRadius: '3px',
  background,
}))

export const text = style({
  display: 'flex',
  flexDirection: 'column',
})

export const caption = style([
  typography.body.caption,
  { color: color.text.secondary },
])

export const value = style({
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
})
