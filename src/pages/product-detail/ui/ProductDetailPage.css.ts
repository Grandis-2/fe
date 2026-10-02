import { style } from '@vanilla-extract/css'

import {
  typography,
  color,
  spacing,
  motion,
  breakpoint,
} from '@/shared/config/theme'
import { maxWidth } from '@/shared/config/theme/tokens/container'

export const contentPadding = style({
  padding: `0 ${spacing[20]}`,
  '@media': {
    // 위 50px는 Container의 위 여백(50px)에 더해져, 헤더 밑에서 콘텐츠까지 웹에서는 100px가 된다.
    [breakpoint.desktop]: { padding: `${spacing[60]} ${spacing[30]} 0` },
  },
})

// 옵션과 같은 컬럼(optionColumn) 안, 색상 위에 놓인다 — 간격은 컬럼의 gap이 준다.
export const title = style([
  typography.title.xlSemibold,
  {
    '@media': {
      // 글자 크기 토큰에 28px가 없어 웹에서만 값으로 덮는다(모바일은 24px 그대로).
      [breakpoint.desktop]: { fontSize: '28px' },
    },
  },
])

// 상품명 바로 밑에 모델명을 붙인다 — 컬럼의 gap(24px)이 아니라 4px로 가깝게.
export const titleGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const modelNumber = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])

export const layout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[20],
  marginBottom: spacing[100],
  '@media': {
    [breakpoint.desktop]: {
      gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
      // 슬라이더와 옵션 패널 사이만 30px — 모바일은 세로로 쌓여 20px 그대로.
      columnGap: spacing[30],
    },
  },
})

export const optionPanel = style({
  display: 'flex',
  height: '100%',
  flexDirection: 'column',
  justifyContent: 'space-between',
  // 옵션이 많아 컬럼이 길어지면 space-between이 줄 틈이 없어 마지막 옵션과 구매 영역이 붙는다.
  gap: spacing[40],
})

export const optionColumn = style({
  display: 'flex',
  flexDirection: 'column',
  // 옵션 섹션(크기/색상/RAM…) 사이를 넉넉히 띄워 한 섹션씩 읽히게 한다.
  gap: spacing[60],
  paddingTop: spacing[16],
})

// 모바일: 하단 고정 주문바(widgets/product-purchase-bar)가 겹칠 일이 없어 top은 항상 0.
// 데스크톱: top이 CSS 변수(--order-bar-offset)로 바뀐다(0 또는 주문바 높이) —
// 주문바가 나타나면 그만큼 아래로 밀려서 겹치지 않는다. 변수는 JSX에서 인라인으로 채운다.
export const tabBarWrapper = style({
  position: 'sticky',
  width: '100%',
  maxWidth: maxWidth.content,
  top: 0,
  zIndex: 1,
  '@media': {
    [breakpoint.desktop]: {
      top: 'var(--order-bar-offset, 0px)',
      transition: `top ${motion.duration.fast} ${motion.easing.default}`,
    },
  },
})

// 모바일 하단 고정 바에 마지막 탭 패널이 가리지 않도록 그만큼 여백을 띄운다.
export const orderBarSpacer = style({
  '@media': {
    [breakpoint.desktop]: {
      display: 'none',
    },
  },
})

// 웹 전용 — 옵션 컬럼 끝에서 "수량" 제목(왼쪽)과 스테퍼(오른쪽)를 한 줄에 놓는다.
// 모바일은 하단 고정바(widgets/product-purchase-bar)에 수량이 있어 숨긴다.
export const quantityOption = style({
  display: 'none',
  '@media': {
    [breakpoint.desktop]: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing[8],
    },
  },
})

// 다른 옵션 제목(ProductOptionSelector의 label)과 같은 크기/색.
export const quantityLabel = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

// 구매 요약 카드 안의 버튼들 — 장바구니(윗줄)와 결제하기(아랫줄)를 세로로 쌓는다.
// 카드 자체가 웹 전용이라 모바일 처리는 따로 필요 없다.
export const actions = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

// 옵션이 많아 오른쪽 컬럼이 이미지보다 길어지므로, 데스크톱에서는 이미지가 고정되고 옵션만
// 스크롤된다. 슬라이더 위로 화면 맨 위와 110px을 남긴 채 멈춘다 — 스크롤해도 이 여백이
// 더 줄어들지 않는다. 스페이싱 토큰에 110px이 없어 값으로 둔다.
// align-self: start가 없으면 칸이 행 높이만큼 늘어나 sticky가 움직일 여유가 없다.
export const imageColumn = style({
  '@media': {
    [breakpoint.desktop]: {
      position: 'sticky',
      top: '110px',
      alignSelf: 'start',
    },
  },
})

// 슬라이더 밑 미리보기 목록 — 웹 전용. 모바일은 점(pagination)과 스와이프로 충분하다.
export const thumbnails = style({
  display: 'none',
  '@media': {
    [breakpoint.desktop]: {
      display: 'flex',
      justifyContent: 'center',
      gap: spacing[12],
      marginTop: spacing[16],
    },
  },
})

export const thumbnail = style({
  width: '80px',
  aspectRatio: '1 / 1',
  padding: 0,
  overflow: 'hidden',
  borderRadius: '8px',
  border: `1px solid ${color.border.default}`,
  background: color.background.surface,
  cursor: 'pointer',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { borderColor: color.border.hover },
  },
})

// 선택된 미리보기는 옵션 타일(SelectButton)처럼 2px처럼 보이는 테두리 — border-width를 바꾸면
// 안쪽이 밀려서 같은 색 inset 그림자로 1px을 더한다.
export const thumbnailSelected = style({
  borderColor: color.primary.focus,
  boxShadow: `inset 0 0 0 1px ${color.primary.focus}`,
  selectors: {
    '&:hover': { borderColor: color.primary.focus },
  },
})

export const thumbnailImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

export const imageFrame = style({
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 1',
  borderRadius: '16px',
  background: color.background.surface,
  overflow: 'hidden',
  '@media': {
    // 데스크톱은 높이만 550px로 고정하고 폭은 열(column)을 꽉 채운다 — 모바일은 정사각형 그대로.
    [breakpoint.desktop]: { aspectRatio: 'auto', height: '550px' },
  },
})

// height:100%를 Slider(Swiper)까지 퍼센트로 내려보내면 aspect-ratio(imageFrame) + flex(swiper-wrapper)
// 조합에서 순환 계산이 발생해 크롬이 LayoutUnit 상한값(약 33554432px)으로 튀는 버그가 있었다 —
// absolute + inset:0으로 imageFrame의 padding box에 기하학적으로 고정시켜 퍼센트 순환 자체를 피한다.
export const sliderFill = style({
  position: 'absolute',
  inset: 0,
})

// contain: 프레임 폭이 줄면 이미지도 비율을 유지한 채 같이 줄어든다(cover는 잘라서 크기가 안 줄어든다).
export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

export const reviewList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  padding: `${spacing[40]} 0`,
})

export const tabPanel = style({
  width: '100%',
  height: '1000px',
  // stickyHeader(주문 요약 바 + ProductPageTab, 총 135px)가 top에 고정돼있어
  // scrollIntoView로 top 0에 붙이면 그 밑에 가려지므로, 그만큼 여유를 둔다.
  scrollMarginTop: '135px',
})
