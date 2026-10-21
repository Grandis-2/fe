import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  spacing,
  productDetailBreakpoint,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@shared/config/theme'
import { maxWidth } from '@shared/config/theme/tokens/container'

// 여백·크기는 실제 화면(ProductDetailPage의 content·sections, ProductGallery, PurchaseSummary,
// ProductPageTab)과 같게 둔다 — 다 왔을 때 자리가 튀지 않게. 저쪽을 바꾸면 여기도 맞춘다.
const sidePadding = `clamp(20px, 4vw, ${spacing[50]})`
const divider = `1px solid ${color.border.subtle}`

export const content = style({
  boxSizing: 'border-box',
  maxWidth: '1600px',
  margin: '0 auto',
  padding: `${spacing[80]} ${sidePadding} ${spacing[90]}`,
  '@media': {
    [productDetailBreakpoint.mobile]: {
      padding: `${spacing[20]} ${spacing[16]} ${spacing[40]}`,
    },
  },
})

// 사진 프레임 안에 막대 하나 — grid라 막대가 프레임 안쪽을 꽉 채운다.
export const imageFrame = style({
  boxSizing: 'border-box',
  display: 'grid',
  aspectRatio: '1 / 1',
  padding: spacing[40],
  borderRadius: '20px',
  background: color.background.base,
  border: divider,
  '@media': {
    [productDetailBreakpoint.desktop]: {
      aspectRatio: '1.25',
      padding: '48px 64px',
    },
  },
})

export const thumbnails = style({
  display: 'none',
  '@media': {
    [productDetailBreakpoint.desktop]: {
      display: 'flex',
      justifyContent: 'center',
      gap: spacing[12],
      marginTop: spacing[16],
    },
  },
})

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const swatches = style({ display: 'flex', gap: spacing[20] })

export const swatch = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[8],
  padding: spacing[4],
})

// 결제 금액 카드 — PurchaseSummary처럼 사이트 웹 폭에서만 보인다.
export const summary = style({
  display: 'none',
  '@media': {
    [breakpoint.desktop]: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing[14],
      padding: '28px',
      borderRadius: '20px',
      background: color.background.base,
      border: divider,
    },
  },
})

export const summarySelected = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  paddingBottom: spacing[20],
  borderBottom: divider,
})

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[6],
})

export const summaryRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const summaryTotal = style([summaryRow, { marginTop: spacing[6] }])

// 장바구니 : 결제하기 = 1 : 1.6 (ProductOverview의 actions와 같다). 버튼은 흐르는 빛 없이 자리만.
export const actions = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)',
  gap: spacing[10],
  marginTop: spacing[12],
})

export const cartButton = style({
  height: '52px',
  borderRadius: '14px',
  background: color.background.surface,
})

export const checkoutButton = style([
  cartButton,
  { background: color.background.subSurface },
])

export const tabBar = style({
  borderTop: divider,
  borderBottom: divider,
})

export const tabs = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  maxWidth: maxWidth.content,
  margin: '0 auto',
})

export const tab = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '56px',
  '@media': { [productDetailBreakpoint.mobile]: { height: '44px' } },
})

export const section = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  maxWidth: maxWidth.content,
  margin: '0 auto',
  padding: `56px ${sidePadding} 64px`,
  '@media': {
    [productDetailBreakpoint.mobile]: {
      padding: `${spacing[32]} ${spacing[16]} ${spacing[40]}`,
    },
  },
})

// 모바일 하단 구매 바 자리 — 사이트 모바일 탭바가 밑에 떠 있으면 그만큼 올린다(ProductPurchaseBar와 같다).
export const bottomBar = style({
  display: 'none',
  '@media': {
    [productDetailBreakpoint.mobile]: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 3,
      display: 'flex',
      gap: spacing[10],
      padding: `${spacing[12]} ${spacing[20]}`,
      background: `color-mix(in srgb, ${color.backgroundDark.base} 42%, transparent)`,
      backdropFilter: 'blur(24px) saturate(180%)',
      borderTop: divider,
    },
    [breakpoint.mobile]: {
      paddingBottom: `calc(${spacing[12]} + ${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET})`,
    },
  },
})

export const bottomCart = style([cartButton, { width: '52px', flexShrink: 0 }])

export const bottomCheckout = style([checkoutButton, { flex: 1 }])
