import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  lineClamp,
  spacing,
  typography,
} from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

// 모바일은 검색 페이지처럼 2열로 놓이는 작은 카드라서(폭 ≈ 170px) 모서리·여백·글자를 줄인다.
// 데스크톱 값은 그대로 두고 아래 '@media'의 mobile 블록에서만 덮어쓴다.

// 메인 카테고리 캐러셀 디자인(Home.dc.html)의 어두운 카드. 카드 root에 data-theme="dark"를 달아
// 안쪽의 color.* 토큰(색상칩·용량 버튼 포함)이 전부 다크 값으로 바뀐다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  overflow: 'hidden',
  width: '100%',
  minWidth: '230px',
  padding: `${spacing[16]} ${spacing[16]} ${spacing[20]}`,
  borderRadius: '18px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
  color: color.text.primary,
  transition: `border-color ${motion.duration.fast}`,
  selectors: {
    '&:hover': { borderColor: color.primary.focus },
  },
  '@media': {
    // 230px 최소 폭은 데스크톱 그리드/캐러셀용 — 2열 셀(≈170px)에선 풀어야 한다.
    [breakpoint.mobile]: {
      minWidth: 0,
      padding: spacing[12],
      borderRadius: '14px',
    },
  },
})

export const media = style({
  position: 'relative',
  width: '100%',
  aspectRatio: '1.15',
  borderRadius: '12px',
  overflow: 'hidden',
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

// 아래 페이지네이션 점(Slider)이 이미지에 겹치지 않게 아래쪽을 더 비운다.
export const image = style({
  position: 'absolute',
  inset: `${spacing[12]} ${spacing[12]} ${spacing[30]}`,
  width: `calc(100% - ${spacing[12]} * 2)`,
  height: `calc(100% - ${spacing[12]} - ${spacing[30]})`,
  objectFit: 'contain',
})

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  width: '100%',
  paddingTop: spacing[12],
  '@media': {
    [breakpoint.mobile]: { gap: spacing[8], paddingTop: spacing[8] },
  },
})

export const nameGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const name = style([
  typography.title.mdSemibold,
  {
    color: color.text.primary,
    textDecoration: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '@media': {
      // 좁은 셀에서 이름이 길어져도 카드 높이가 들쭉날쭉하지 않게 두 줄까지만 보인다.
      [breakpoint.mobile]: {
        fontSize: fontSize[14],
        whiteSpace: 'normal',
        ...lineClamp(2),
      },
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
  marginTop: spacing[6],
  display: 'flex',
  alignItems: 'baseline',
  color: color.text.primary,
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
