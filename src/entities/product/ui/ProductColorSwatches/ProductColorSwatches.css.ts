import { style, styleVariants } from '@vanilla-extract/css'

import {
  color,
  motion,
  spacing,
  productDetailBreakpoint,
} from '@shared/config/theme'
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

// medium 동그라미(34px)는 그 아래 이름 칸(64px) 가운데에 놓인다.
const swatchSize = 34
const swatchLabelWidth = 64

export const swatchRow = styleVariants({
  small: [swatchRowBase, { gap: spacing[8] }],
  medium: [
    swatchRowBase,
    {
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: spacing[12],
      // 이름 칸이 동그라미보다 넓은 만큼 줄을 왼쪽으로 당겨 첫 동그라미를 '색상' 제목에 맞춘다.
      marginLeft: `${(swatchSize - swatchLabelWidth) / 2}px`,
    },
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
      width: `${swatchSize}px`,
      height: `${swatchSize}px`,
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

// medium만 이름을 단다 — 이름 칸 폭을 고정해 이름 길이와 상관없이 동그라미 간격이 같게 하고, 긴 이름은 줄을 바꾼다.
export const swatchLabel = style({
  width: `${swatchLabelWidth}px`,
  textAlign: 'center',
  wordBreak: 'keep-all',
  color: color.text.tertiary,
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: { [`${swatchButton}:hover &`]: { color: color.text.primary } },
})

export const swatchLabelSelected = style({ color: color.text.primary })

// medium 전용 '색상' 제목 — ProductOptionSelector 제목과 맞춰 모바일에서 한 단계 작게.
export const label = style({
  color: color.text.primary,
  '@media': { [productDetailBreakpoint.mobile]: { fontSize: fontSize[16] } },
})
