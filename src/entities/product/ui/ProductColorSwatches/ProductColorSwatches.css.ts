import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'

const rootBase = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
})

export const root = styleVariants({
  small: [rootBase, { gap: spacing[6], marginBottom: spacing[4] }],
  medium: [rootBase, { gap: spacing[12], marginBottom: spacing[4] }],
})

export const colorName = style({ color: color.text.tertiary })

const swatchRowBase = style({ display: 'flex', alignItems: 'center' })

export const swatchRow = styleVariants({
  small: [swatchRowBase, { gap: spacing[8] }],
  medium: [swatchRowBase, { alignItems: 'flex-start', gap: spacing[24] }],
})

const swatchBase = style({
  borderRadius: '9999px',
  border: `0.75px solid ${color.border.default}`,
  padding: 0,
})

export const swatch = styleVariants({
  small: [swatchBase, { width: '18px', height: '18px' }],
  medium: [swatchBase, { width: '32px', height: '32px' }],
})

export const swatchSelected = style({
  outline: `1.5px solid ${color.primary.focus}`,
  outlineOffset: '2px',
  border: 'none',
})

// 동그라미(swatch)와 그 아래 색 이름(swatchLabel)을 한 버튼으로 묶어 이름을 눌러도 선택된다.
export const swatchButton = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[8],
  border: 'none',
  background: 'none',
  padding: 0,
})

export const swatchInteractive = style({ cursor: 'pointer' })

export const swatchLabel = style({ color: color.text.secondary })

export const label = style({ color: color.text.primary })
