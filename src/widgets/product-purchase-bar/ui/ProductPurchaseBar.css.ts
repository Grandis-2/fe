import { style } from '@vanilla-extract/css'

import {
  typography,
  color,
  spacing,
  motion,
  breakpoint,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@shared/config/theme'

export const productName = style([typography.title.lgSemibold])
export const productOption = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

// 모바일: 화면 하단에 항상 고정(장바구니/결제하기가 스크롤과 무관하게 늘 보여야 함).
// 바텀시트(sheet)와 같은 flex-column 컨테이너에 넣어서 시트가 항상 바로 위에 딱 붙는다 —
// bottom 오프셋을 픽셀로 직접 계산할 필요가 없어 겹치거나 틈이 생기지 않는다.
// 데스크톱: 이 컨테이너엔 바 하나만 남고(시트는 안 보임), 기존처럼 top 고정.
export const bottomBarGroup = style({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 3,
  display: 'flex',
  flexDirection: 'column',
  '@media': {
    [breakpoint.desktop]: {
      top: 0,
      bottom: 'auto',
      // 안의 orderBar가 translateY로 화면 밖에 숨어 있어도 이 컨테이너의 레이아웃
      // 박스(=orderBar 높이)는 헤더와 같은 자리에 그대로 남아 클릭을 가로챈다 —
      // 평소엔 이벤트를 통과시키고, orderBar가 실제로 보일 때만(bottomBarGroupVisible)
      // 되살린다.
      pointerEvents: 'none',
    },
  },
})

export const bottomBarGroupVisible = style({
  '@media': {
    [breakpoint.desktop]: {
      pointerEvents: 'auto',
    },
  },
})

// 평소엔 뷰포트 위로 숨겨뒀다가 이미지/옵션 패널(layout)이 화면에서 사라지면
// isLayoutVisible이 false가 되면서 transform만 바뀌어 위에서 아래로 슬라이드된다 — 데스크톱 전용.
// ProductPageTab(tabBarWrapper)과는 분리 — 탭은 항상 떠 있어야 하고, 이 바만 나타났다 사라진다.
export const orderBar = style({
  background: `color-mix(in srgb, ${color.background.base} 80%, transparent)`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  '@media': {
    // 모바일 탭바가 바 아래쪽에 떠 있으므로 그만큼 바 배경을 늘려 버튼이 가리지 않게 한다.
    [breakpoint.mobile]: {
      paddingBottom: `calc(${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET})`,
    },
    [breakpoint.desktop]: {
      transform: 'translateY(-100%)',
      transition: `transform ${motion.duration.fast} ${motion.easing.default}`,
    },
  },
})

// 모바일에서는 orderBar가 항상 보이므로 이 클래스가 할 일이 없다 — 데스크톱에서만 슬라이드 인.
export const orderBarVisible = style({
  '@media': {
    [breakpoint.desktop]: {
      transform: 'translateY(0)',
    },
  },
})

// 모바일: 수량/가격 줄(orderBarQuantityPrice) 아래에 버튼 줄이 전체 폭으로 놓인다.
// 데스크톱: 기존처럼 1fr(정보) + auto(버튼) 두 칸 그리드.
// 위/아래 선 위치도 바가 붙는 쪽(모바일 위쪽, 데스크톱 아래쪽)에 맞춰 반전.
export const orderBarContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  borderTop: `1px solid ${color.border.default}`,
  '@media': {
    [breakpoint.desktop]: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 0,
      borderTop: 'none',
      borderBottom: `1px solid ${color.border.default}`,
    },
  },
})

// 모바일 전용 — 순차배송 안내를 버튼 줄 위에 보여준다(데스크톱은 옵션 패널의 shipmentNotice로 충분).
export const orderBarShipmentNotice = style([
  typography.body.defaultMedium,
  {
    color: color.primary.base,
    textAlign: 'center',
    '@media': {
      [breakpoint.desktop]: {
        display: 'none',
      },
    },
  },
])

// 모바일은 수량/가격 줄이 있어 상품명/옵션 텍스트는 고정바에서 숨긴다.
export const orderBarInfo = style({
  display: 'none',
  '@media': {
    [breakpoint.desktop]: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing[2],
    },
  },
})

// 모바일 전용 — 수량 스테퍼와 가격을 버튼 줄 위에 양 끝으로 보여준다. 데스크톱은 옵션
// 패널(layout)에 같은 줄이 있고 가격은 결제 버튼에 들어가므로 숨긴다.
export const orderBarQuantityPrice = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
  '@media': {
    [breakpoint.desktop]: {
      display: 'none',
    },
  },
})

// 모바일은 버튼 줄이 전체 폭을 차지, 데스크톱은 내용 크기로.
export const orderBarButtons = style({
  display: 'flex',
  gap: spacing[8],
  width: '100%',
  '@media': {
    [breakpoint.desktop]: {
      width: 'auto',
    },
  },
})

export const orderBarIconButton = style({
  width: '46px',
})

// 모바일은 장바구니 버튼(46px)을 뺀 나머지 가로를 전부 차지. 데스크톱은 기존처럼 내용 크기.
export const orderBarCheckoutButton = style({
  flex: 1,
  padding: `0 ${spacing[24]}`,
  '@media': {
    [breakpoint.desktop]: {
      flex: 'initial',
    },
  },
})

// 결제 버튼은 모바일/데스크톱 두 벌 렌더링한다(ProductPurchaseBar.tsx) — 문구가 다르다
// (데스크톱만 가격이 들어간다).
export const orderBarCheckoutButtonMobile = style({
  '@media': {
    [breakpoint.desktop]: {
      display: 'none',
    },
  },
})

export const orderBarCheckoutButtonDesktop = style({
  display: 'none',
  '@media': {
    [breakpoint.desktop]: {
      display: 'inline-flex',
    },
  },
})
