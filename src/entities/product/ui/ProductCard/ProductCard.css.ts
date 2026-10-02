import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  lineClamp,
  spacing,
  typography,
} from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

// 모바일은 검색 페이지처럼 2열로 놓이는 작은 카드라서(폭 ≈ 170px) 모서리·여백·글자를 줄인다.
// 데스크톱 값은 그대로 두고 아래 '@media'의 mobile 블록에서만 덮어쓴다.

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
  '@media': {
    // 230px 최소 폭은 데스크톱 그리드/캐러셀용 — 2열 셀(≈170px)에선 풀어야 한다.
    [breakpoint.mobile]: { minWidth: 0, borderRadius: '12px' },
  },
})

export const media = style({
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 1',
  // surface(#F7F7F9)는 페이지 배경(page #F7F8FC)과 거의 같아 카드 윗변이 사라진다 — 배경을 따로 칠하지 않고
  // root(흰색 95%)가 그대로 보이게 해서 카드 전체를 한 톤으로 만든다. 흰색을 직접 칠하면 어두운 캐러셀 위에서
  // root만 반투명이라 이미지 영역과 본문이 두 톤으로 갈라진다.
  borderRadius: '16px',
  '@media': {
    [breakpoint.mobile]: { borderRadius: '12px' },
  },
})

// height:100%를 Slider(Swiper)까지 퍼센트로 내려보내면 aspect-ratio(media) + flex(swiper-wrapper) 조합에서
// 순환 계산이 발생해 크롬이 LayoutUnit 상한값(약 33554432px)으로 튀는 버그가 있었다 — absolute + inset:0으로
// media의 padding box에 기하학적으로 고정시켜 퍼센트 순환 자체를 피한다.
export const badge = style({
  position: 'absolute',
  top: spacing[12],
  left: spacing[12],
  zIndex: 1,
  '@media': {
    [breakpoint.mobile]: { top: spacing[8], left: spacing[8] },
  },
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
  '@media': {
    [breakpoint.mobile]: { gap: spacing[8], padding: spacing[12] },
  },
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
    '@media': {
      // 좁은 셀에서 이름이 길어져도 카드 높이가 들쭉날쭉하지 않게 두 줄까지만 보인다.
      [breakpoint.mobile]: { fontSize: fontSize[14], ...lineClamp(2) },
    },
  },
])
export const modelNumber = style({
  color: color.text.tertiary,
  '@media': {
    [breakpoint.mobile]: { fontSize: fontSize[12] },
  },
})

export const priceRow = style({
  height: '26px',
  display: 'flex',
  alignItems: 'baseline',
  color: color.text.primary,
  '@media': {
    [breakpoint.mobile]: { height: 'auto' },
  },
})

export const priceAmount = style({
  color: 'inherit',
  '@media': {
    [breakpoint.mobile]: { fontSize: fontSize[18] },
  },
})
export const priceUnit = style({
  color: 'inherit',
  marginLeft: spacing[2],
  '@media': {
    [breakpoint.mobile]: { fontSize: fontSize[14] },
  },
})
