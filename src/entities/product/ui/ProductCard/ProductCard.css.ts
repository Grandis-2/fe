import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  overflow: 'hidden',
  width: '100%',
  minWidth: '230px',
  borderRadius: '16px',
  // opacity는 자식(텍스트/이미지)까지 다 흐려지므로, 배경색에만 alpha를 섞는다.
  background: `color-mix(in srgb, ${color.background.base} 95%, transparent)`,
})

export const media = style({
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 1',
  background: color.background.surface,
  borderRadius: '16px',
})

// height:100%를 Slider(Swiper)까지 퍼센트로 내려보내면 aspect-ratio(media) + flex(swiper-wrapper) 조합에서
// 순환 계산이 발생해 크롬이 LayoutUnit 상한값(약 33554432px)으로 튀는 버그가 있었다 — absolute + inset:0으로
// media의 padding box에 기하학적으로 고정시켜 퍼센트 순환 자체를 피한다.
export const badge = style({
  position: 'absolute',
  top: spacing[12],
  left: spacing[12],
  zIndex: 1,
})

export const sliderFill = style({
  position: 'absolute',
  inset: 0,
})

// 267.5px 카드 기준 34px 인셋/200px 크기 비율을 %로 유지해, media가 커져도 같은 비율을 유지한다.
export const image = style({
  position: 'absolute',
  left: '12.71%',
  top: '12.71%',
  width: '74.77%',
  height: '74.77%',
  objectFit: 'cover',
})

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  width: '100%',
  padding: `${spacing[16]}`,
})

export const nameGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const name = style([
  typography.title.mdMedium,
  {
    color: color.text.primary,
    cursor: 'pointer',
  },
])
export const modelNumber = style({ color: color.text.tertiary })

export const priceRow = style({
  height: '26px',
  display: 'flex',
  alignItems: 'baseline',
  color: color.text.primary,
})

export const priceAmount = style({ color: 'inherit' })
export const priceUnit = style({ color: 'inherit', marginLeft: spacing[2] })
