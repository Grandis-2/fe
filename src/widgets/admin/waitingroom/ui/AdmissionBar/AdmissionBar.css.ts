import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const track = style({
  position: 'relative',
  height: '14px',
  borderRadius: '7px',
  background: color.background.subSurface,
  overflow: 'hidden',
})

const fillBase = style({ position: 'absolute', inset: '0 auto 0 0' })

// 판정 색과 같다 — 막대만 봐도 문구와 같은 뜻으로 읽힌다.
export const fill = styleVariants({
  success: [fillBase, { background: color.status.success }],
  warning: [fillBase, { background: color.status.warning }],
  danger: [fillBase, { background: color.status.danger }],
  muted: [fillBase, { background: color.text.disabled }],
})

const previewBase = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  boxSizing: 'border-box',
  border: '2px dashed',
})

// 바꿀 값과 지금의 차이 — 실제가 아니라 미리보기라 빗금과 점선으로 구분한다.
export const preview = styleVariants({
  within: [
    previewBase,
    {
      borderColor: color.primary.base,
      background: `repeating-linear-gradient(135deg, ${color.primary.subtler} 0 6px, transparent 6px 12px)`,
    },
  ],
  over: [
    previewBase,
    {
      borderColor: color.status.danger,
      background: `repeating-linear-gradient(135deg, ${color.status.danger} 0 2px, transparent 2px 10px)`,
    },
  ],
})

export const capLine = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: '2px',
  background: color.text.primary,
})

export const labels = style({
  position: 'relative',
  height: '18px',
})

export const label = style([
  typography.body.caption,
  {
    position: 'absolute',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    color: color.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const labelStrong = style([
  label,
  typography.body.captionMedium,
  { color: color.text.primary },
])
