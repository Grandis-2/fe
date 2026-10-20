import { createVar, fallbackVar, style } from '@vanilla-extract/css'

import {
  color,
  spacing,
  typography,
  productDetailBreakpoint,
} from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

// 글자색을 직접 잡는다 — 관리자 미리보기 모달 안에선 구매자 상세 바탕(root)의 글자색을 물려받지 못한다.
export const layout = style({
  color: color.text.primary,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[24],
  '@media': {
    [productDetailBreakpoint.desktop]: {
      // 사진·옵션 둘 다 340px 아래로 줄지 않는다 — 둘이 안 들어가는 폭은 productDetailBreakpoint가 한 칸(모바일)으로 바꾼다.
      gridTemplateColumns: 'minmax(340px, 2fr) minmax(340px, 1fr)',
      gap: spacing[40],
    },
  },
})

// 사진이 멈추는 높이. 구매자 상세는 고정 헤더 밑(96px), 미리보기 모달은 스크롤 영역 맨 위(0)다.
export const stickyTop = createVar()

// 옵션이 많아 오른쪽 컬럼이 더 길다 — 데스크톱에선 이미지가 헤더 밑에 멈춰 있고 옵션만 스크롤된다.
// align-self: start가 없으면 칸이 행 높이만큼 늘어나 sticky가 움직일 여유가 없다.
export const imageColumn = style({
  width: '100%',
  '@media': {
    [productDetailBreakpoint.desktop]: {
      position: 'sticky',
      top: fallbackVar(stickyTop, '96px'),
      alignSelf: 'start',
    },
  },
})

// 아래 actions가 화면 폭이 아니라 이 패널 폭을 보고 장바구니 버튼을 줄인다(2:1 그리드라 화면 폭과 비례하지 않음).
export const optionPanel = style({
  containerType: 'inline-size',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[40],
})

export const titleGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const title = style([
  typography.title.xlSemibold,
  {
    margin: 0,
    fontWeight: fontWeight.bold,
    '@media': {
      // 글자 크기 토큰에 30px가 없어 웹에서만 값으로 덮는다.
      [productDetailBreakpoint.desktop]: { fontSize: '30px' },
      [productDetailBreakpoint.mobile]: { fontSize: fontSize[20] },
    },
  },
])

export const modelNumber = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])

// 웹 전용 — "수량" 제목(왼쪽)과 스테퍼(오른쪽)를 한 줄에 둔다. 모바일은 하단 구매 바에 수량이 있다.
export const quantityOption = style({
  display: 'none',
  '@media': {
    [productDetailBreakpoint.desktop]: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing[8],
    },
  },
})

// 다른 옵션 제목(ProductOptionSelector medium)과 같은 크기.
export const quantityLabel = typography.title.mdSemibold

// 장바구니(좁게) + 결제하기(넓게) 한 줄.
// 패널이 좁아지면 장바구니는 요약바처럼 아이콘만 남기고 결제 버튼이 나머지 폭을 쓴다.
const NARROW_PANEL = '(max-width: 420px)'

export const actions = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)',
  gap: spacing[10],
  marginTop: spacing[12],
  '@container': {
    [NARROW_PANEL]: { gridTemplateColumns: 'auto minmax(0, 1fr)' },
  },
})

export const cartButton = style({
  '@container': {
    [NARROW_PANEL]: { aspectRatio: '1', padding: 0 },
  },
})

export const cartLabel = style({
  '@container': {
    [NARROW_PANEL]: { display: 'none' },
  },
})

// 사전예약은 장바구니가 없어 결제 버튼이 한 줄을 다 쓴다.
export const checkoutFull = style({ gridColumn: '1 / -1' })
