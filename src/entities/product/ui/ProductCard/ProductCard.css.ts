import { createVar, style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  lineClamp,
  skeleton,
  spacing,
  typography,
} from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

// 모바일은 검색 페이지처럼 2열로 놓이는 작은 카드라서(폭 ≈ 170px) 모서리·여백·글자를 줄인다.
// 데스크톱 값은 그대로 두고 아래 '@media'의 mobile 블록에서만 덮어쓴다.

// 메인 카테고리 캐러셀 디자인(Home.dc.html)의 어두운 카드. 카드 root에 data-theme="dark"를 달아
// 안쪽의 color.* 토큰(색상칩 포함)이 전부 다크 값으로 바뀐다. 주요 글자는 text.primary, 보조 글자는 text.tertiary.
// 카드 좌우·위 여백. 이미지 칸(media)이 이만큼 바깥으로 넓혀 카드 가장자리까지 닿는다.
const pad = createVar()

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  overflow: 'hidden',
  width: '100%',
  minWidth: '230px',
  vars: { [pad]: spacing[16] },
  padding: `${pad} ${pad} ${spacing[20]}`,
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
      vars: { [pad]: spacing[12] },
      padding: pad,
      borderRadius: '14px',
    },
  },
})

// 카드 여백 밖까지 넓혀 위·좌우 가장자리에 붙인다 — 슬라이드가 카드 안쪽 선에서 잘려 보이지 않고
// 카드 끝에서 들어오고 나간다. 모서리는 카드(root)의 overflow·radius가 깎는다.
export const media = style({
  position: 'relative',
  width: `calc(100% + 2 * ${pad})`,
  margin: `calc(-1 * ${pad}) calc(-1 * ${pad}) 0`,
  aspectRatio: '1',
  overflow: 'hidden',
})

// height:100%를 Slider(Swiper)까지 퍼센트로 내려보내면 aspect-ratio(media) + flex(swiper-wrapper) 조합에서
// 순환 계산이 발생해 크롬이 LayoutUnit 상한값(약 33554432px)으로 튀는 버그가 있었다 — absolute + inset:0으로
// media의 padding box에 기하학적으로 고정시켜 퍼센트 순환 자체를 피한다.
// 카드 여백만큼 들여 아래 이름·가격과 왼쪽 선을 맞춘다.
export const badge = style({
  position: 'absolute',
  top: pad,
  left: pad,
  zIndex: 1,
})

export const sliderFill = style({
  position: 'absolute',
  inset: 0,
})

// 위는 카드 여백 + 사전예약 태그 높이만큼, 아래는 페이지네이션 점(Slider)만큼 비워 둘에 이미지가 겹치지 않게 한다.
export const image = style({
  position: 'absolute',
  inset: `calc(${pad} + ${spacing[24]}) 0 ${spacing[30]}`,
  width: '100%',
  height: `calc(100% - ${pad} - ${spacing[24]} - ${spacing[30]})`,
  objectFit: 'contain',
  // ponytail: 상품 PNG에 투명 여백이 좌우 20%씩 있어 키워서 여백을 칸 밖으로 잘라낸다(랭킹 카드와 같은 이유) —
  // 여백 없이 꽉 찬 이미지가 들어오면 가장자리가 잘리니 그때는 scale을 뺀다.
  transform: 'scale(1.4)',
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
    // 같은 색의 가격(600)과 굵기로 구분한다.
    fontWeight: fontWeight.medium,
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
  flexWrap: 'wrap',
  alignItems: 'baseline',
  color: color.text.primary,
})

export const priceAmount = style({
  color: 'inherit',
  fontWeight: fontWeight.semibold,
  '@media': {
    [breakpoint.mobile]: { fontSize: fontSize[16] },
  },
})
// 할인 시 정가는 할인율·판매가 위 한 줄을 통째로 차지한다(flex-basis 100%).
export const originalPrice = style({
  flexBasis: '100%',
  color: color.text.tertiary,
  '@media': {
    [breakpoint.mobile]: { fontSize: fontSize[12] },
  },
})

export const discountRate = style({
  color: color.status.danger,
  marginRight: spacing[6],
  '@media': {
    [breakpoint.mobile]: { fontSize: fontSize[16], marginRight: spacing[4] },
  },
})

export const priceUnit = style({
  color: color.text.tertiary,
  marginLeft: spacing[2],
  '@media': {
    [breakpoint.mobile]: { fontSize: fontSize[12] },
  },
})

// 스켈레톤 — 실제 카드와 같은 root·media·content 뼈대를 쓰고 안쪽만 셔머 블록으로 채워 로딩이 끝나도 레이아웃이 튀지 않게 한다.
export const skeletonMedia = style([media, skeleton, { borderRadius: '12px' }])

export const skeletonDots = style({
  display: 'flex',
  justifyContent: 'center',
  gap: spacing[6],
  marginTop: spacing[10],
  width: '100%',
})

export const skeletonDot = style([
  skeleton,
  { width: '5px', height: '5px', borderRadius: '50%' },
])

export const skeletonLine = style([skeleton, { borderRadius: '6px' }])

export const skeletonSwatches = style({ display: 'flex', gap: spacing[8] })

export const skeletonSwatch = style([
  skeleton,
  { width: '18px', height: '18px', borderRadius: '50%' },
])
