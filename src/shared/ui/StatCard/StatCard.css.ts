import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  padding: spacing[20],
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  background: color.background.base,
})

export const tone = styleVariants({
  warning: [
    root,
    {
      background: color.background.subtleWarning,
      borderColor: `color-mix(in srgb, ${color.status.warning} 40%, transparent)`,
    },
  ],
  danger: [
    root,
    {
      background: color.background.subtleDanger,
      borderColor: `color-mix(in srgb, ${color.status.danger} 30%, transparent)`,
    },
  ],
})

export const label = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const value = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

export const valueDanger = style([value, { color: color.status.danger }])

/** 수치가 아닌 값(조회 실패 등)은 흐리게 — 0건과 헷갈리면 안 된다 */
export const valueMuted = style([value, { color: color.text.tertiary }])

export const caption = style([
  typography.body.sub,
  { color: color.text.tertiary },
])
