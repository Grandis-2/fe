import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

const base = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  padding: `${spacing[16]} ${spacing[20]}`,
  borderRadius: '12px',
  border: '1px solid transparent',
})

// 빨강: 지금 눌러야 하는 것 / 주황: 알아 둘 것(할 일 없음) / 초록: 이상 없음 / 회색: 상황 설명.
export const tone = styleVariants({
  danger: [
    base,
    {
      background: color.background.subtleDanger,
      borderColor: `color-mix(in srgb, ${color.status.danger} 30%, transparent)`,
    },
  ],
  warning: [
    base,
    {
      background: color.background.subtleWarning,
      borderColor: `color-mix(in srgb, ${color.status.warning} 40%, transparent)`,
    },
  ],
  success: [
    base,
    {
      background: color.background.subtleSuccess,
      borderColor: `color-mix(in srgb, ${color.status.success} 30%, transparent)`,
    },
  ],
  info: [
    base,
    { background: color.background.surface, borderColor: color.border.default },
  ],
})

export const head = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${spacing[12]} ${spacing[16]}`,
})

export const text = style({
  flex: '1 1 360px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const title = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const description = style([
  typography.body.sub,
  { color: color.text.secondary },
])
