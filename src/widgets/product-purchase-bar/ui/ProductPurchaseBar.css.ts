import { style, keyframes } from '@vanilla-extract/css'

import { typography, color, spacing, motion } from '@/shared/config/theme'
import { breakpoint } from '@/shared/config/theme/tokens/breakpoint'

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
    [breakpoint.desktop]: {
      transform: 'translateY(-100%)',
      transition: `transform ${motion.duration.fast} ${motion.easing.default}`,
    },
  },
})

// 바 배경이 반투명(20%)이라 뒤의 검은 백드롭이 그대로 비쳐 보였다 —
// 시트가 떠 있는 동안만 불투명하게 덮어써서 바가 어두워 보이지 않게 한다.
export const orderBarOpaque = style({
  background: color.background.base,
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
})

// 모바일에서는 orderBar가 항상 보이므로 이 클래스가 할 일이 없다 — 데스크톱에서만 슬라이드 인.
export const orderBarVisible = style({
  '@media': {
    [breakpoint.desktop]: {
      transform: 'translateY(0)',
    },
  },
})

// 모바일: 상품명/옵션 텍스트는 바텀시트로 옮겨갔으니 버튼 줄만 전체 폭으로 보여준다.
// 데스크톱: 기존처럼 1fr(정보) + auto(버튼) 두 칸 그리드.
// 위/아래 선 위치도 바가 붙는 쪽(모바일 위쪽, 데스크톱 아래쪽)에 맞춰 반전.
export const orderBarContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
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

// 모바일에서는 바텀시트가 이 정보를 대신 보여주므로 고정바에서는 숨긴다.
export const orderBarInfo = style({
  display: 'none',
  '@media': {
    [breakpoint.desktop]: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[12],
    },
  },
})

// 모바일은 orderBarContent의 유일한 자식이 되어 전체 폭을 차지, 데스크톱은 내용 크기로.
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

// 모바일은 "결제하기"만, 데스크톱은 가격을 붙인 문구를 보여준다 — 텍스트라 display 스위치로 처리.
export const orderBarCheckoutLabelMobile = style({
  '@media': {
    [breakpoint.desktop]: {
      display: 'none',
    },
  },
})

export const orderBarCheckoutLabelDesktop = style({
  display: 'none',
  '@media': {
    [breakpoint.desktop]: {
      display: 'inline',
    },
  },
})

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const slideUp = keyframes({
  from: { transform: 'translateY(16px)', opacity: 0 },
  to: { transform: 'translateY(0)', opacity: 1 },
})

// 모바일 전용 — 결제하기를 누르면 수량/가격을 다시 볼 수 있는 바텀시트.
// isSheetOpen일 때만 마운트되고(컴포넌트 참고), bottomBarGroup 안에서 orderBar 바로 위
// flex 자식으로 쌓이므로 오프셋을 직접 계산하지 않아도 항상 바에 딱 붙는다 —
// 두 번째 탭이 실제 결제로 이어진다.
export const sheetBackdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 2,
  background: 'rgba(0, 0, 0, 0.4)',
  animation: `${fadeIn} ${motion.duration.fast} ${motion.easing.default}`,
  '@media': {
    [breakpoint.desktop]: {
      display: 'none',
    },
  },
})

export const sheet = style({
  background: color.background.base,
  borderRadius: '20px 20px 0 0',
  padding: `${spacing[8]} ${spacing[20]} ${spacing[24]}`,
  boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.12)',
  animation: `${slideUp} ${motion.duration.fast} ${motion.easing.default}`,
  '@media': {
    [breakpoint.desktop]: {
      display: 'none',
    },
  },
})

export const sheetHandle = style({
  width: '36px',
  height: '4px',
  borderRadius: '2px',
  background: color.border.default,
  margin: `0 auto ${spacing[16]}`,
})

export const sheetInfo = style({
  marginBottom: spacing[16],
})

export const sheetRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
})
