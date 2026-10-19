import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

export const capCell = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[8],
  fontVariantNumeric: 'tabular-nums',
})

export const miniTrack = style({
  position: 'relative',
  width: '96px',
  height: '8px',
  borderRadius: '4px',
  background: color.background.subSurface,
  overflow: 'hidden',
})

const miniFillBase = style({ position: 'absolute', inset: '0 auto 0 0' })

// 상한에 닿은 상품만 주황 — 그 상품은 전역 속도를 올려도 몫이 늘지 않는다.
export const miniFill = styleVariants({
  normal: [miniFillBase, { background: color.primary.base }],
  atCap: [miniFillBase, { background: color.status.warning }],
})

// 1분 넘게 기다린 등록 — 밀리는 상품만 눈에 띄게.
export const slowText = style({
  color: color.status.danger,
  fontWeight: fontWeight.semibold,
})

export const rowActions = style({
  display: 'inline-flex',
  justifyContent: 'flex-end',
  gap: spacing[8],
})
