import { style } from '@vanilla-extract/css'

import { typography, color, spacing, motion } from '@/shared/config/theme'
import { breakpoint } from '@/shared/config/theme/tokens/breakpoint'
import { maxWidth } from '@/shared/config/theme/tokens/container'

export const contentPadding = style({
  padding: `0 ${spacing[20]}`,
})

export const title = style([
  typography.title.xlSemibold,
  {
    marginBottom: spacing[30],
    marginLeft: spacing[8],
  },
])

export const layout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[20],
  marginBottom: spacing[100],
  '@media': {
    [breakpoint.desktop]: {
      gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    },
  },
})

export const optionPanel = style({
  display: 'flex',
  height: '100%',
  flexDirection: 'column',
  justifyContent: 'space-between',
})

export const optionColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
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

// 수량/가격, 순차배송 안내, 구매 버튼을 한 묶음으로 본다.
export const purchaseSummary = style({
  display: 'flex',
  flexDirection: 'column',
})

// 모바일은 하단 고정바(widgets/product-purchase-bar)에 가격이 이미 표시되므로 패널에서는 숨긴다.
export const quantityPriceRow = style({
  display: 'none',
  gap: spacing[8],
  marginBottom: spacing[16],
  '@media': {
    [breakpoint.desktop]: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  },
})

// 모바일은 하단 고정바(widgets/product-purchase-bar)의 버튼과 중복되므로 숨긴다.
export const actions = style({
  display: 'none',
  gap: spacing[8],
  '@media': {
    [breakpoint.desktop]: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
    },
  },
})

export const actionsSingle = style({
  display: 'none',
  gap: spacing[8],
  '@media': {
    [breakpoint.desktop]: {
      display: 'grid',
      gridTemplateColumns: '1fr',
    },
  },
})

// 모바일은 하단 고정바(widgets/product-purchase-bar)에 같은 문구가 있으므로 패널에서는 숨긴다.
export const shipmentNotice = style([
  typography.body.defaultMedium,
  {
    display: 'none',
    color: color.primary.base,
    textAlign: 'center',
    marginTop: spacing[16],
    marginBottom: spacing[8],
    '@media': {
      [breakpoint.desktop]: {
        display: 'block',
      },
    },
  },
])

export const imageFrame = style({
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 1',
  borderRadius: '16px',
  background: color.background.surface,
  overflow: 'hidden',
})

// height:100%를 Slider(Swiper)까지 퍼센트로 내려보내면 aspect-ratio(imageFrame) + flex(swiper-wrapper)
// 조합에서 순환 계산이 발생해 크롬이 LayoutUnit 상한값(약 33554432px)으로 튀는 버그가 있었다 —
// absolute + inset:0으로 imageFrame의 padding box에 기하학적으로 고정시켜 퍼센트 순환 자체를 피한다.
export const sliderFill = style({
  position: 'absolute',
  inset: 0,
})

export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
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
