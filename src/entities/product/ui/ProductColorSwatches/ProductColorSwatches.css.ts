import { style, styleVariants } from '@vanilla-extract/css'

import { breakpoint, color, motion, spacing } from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

const rootBase = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
})

export const root = styleVariants({
  small: [rootBase, { gap: spacing[6], marginBottom: spacing[4] }],
  medium: [rootBase, { gap: spacing[12] }],
})

export const colorName = style({ color: color.text.tertiary })

const swatchRowBase = style({ display: 'flex', alignItems: 'center' })

export const swatchRow = styleVariants({
  small: [swatchRowBase, { gap: spacing[8] }],
  medium: [
    swatchRowBase,
    { alignItems: 'flex-start', flexWrap: 'wrap', gap: spacing[20] },
  ],
})

const swatchBase = style({
  borderRadius: '9999px',
  border: `0.75px solid ${color.border.default}`,
  padding: 0,
})

export const swatch = styleVariants({
  small: [swatchBase, { width: '18px', height: '18px' }],
  // 바탕과 비슷한 색(스페이스 블랙)도 보이게 테두리 대신 옅은 안쪽 선을 두른다.
  medium: [
    swatchBase,
    {
      width: '34px',
      height: '34px',
      border: 'none',
      boxShadow: `inset 0 0 0 1px ${color.border.hover}`,
      transition: `outline-color ${motion.duration.fast} ${motion.easing.default}`,
    },
  ],
})

export const swatchSelected = style({
  outline: `1.5px solid ${color.primary.subtle}`,
  outlineOffset: '3px',
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

export const swatchLabel = style({
  color: color.text.tertiary,
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: { [`${swatchButton}:hover &`]: { color: color.text.primary } },
})

export const swatchLabelSelected = style({ color: color.text.primary })

// medium 전용 '색상' 제목 — ProductOptionSelector 제목과 맞춰 모바일에서 한 단계 작게.
export const label = style({
  color: color.text.primary,
  '@media': { [breakpoint.mobile]: { fontSize: fontSize[16] } },
})
