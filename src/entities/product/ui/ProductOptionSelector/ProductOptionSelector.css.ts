import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing } from '@/shared/config/theme'

const rootBase = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  background: 'transparent',
})

// small: 카드 안에서 쓴다 — 카드 자체가 이미 바깥 여백/간격을 관리하므로 padding 없이
// 라벨-옵션 간격만 좁게(6px) 붙인다.
// medium: 상세 페이지 옵션 패널에서 쓰던 기존 값 그대로.
export const root = styleVariants({
  small: [rootBase, { gap: spacing[6] }],
  medium: [rootBase, { gap: spacing[10], padding: `${spacing[12]} 0` }],
})

export const label = style({ color: color.text.primary })

const optionRowBase = style({ display: 'flex', alignItems: 'center' })

export const optionRow = styleVariants({
  small: [optionRowBase, { gap: spacing[6] }],
  medium: [optionRowBase, { gap: spacing[8] }],
})
