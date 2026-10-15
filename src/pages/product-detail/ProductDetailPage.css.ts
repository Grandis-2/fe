import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  spacing,
  typography,
} from '@shared/config/theme'
import { maxWidth } from '@shared/config/theme/tokens/container'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'
import { headerHeight } from '@widgets/header'

// 위에서 내려오는 주문바(Container, 1200px · 좌우 50px)와 글 시작선을 맞춘다.
const sidePadding = `clamp(20px, 4vw, ${spacing[50]})`

// 어두운 페이지 — 헤더 높이만큼 끌어올려 헤더 뒤까지 바탕을 깐다(data-header-theme="dark").
export const root = style({
  boxSizing: 'border-box',
  minHeight: '100vh',
  marginTop: `calc(-1 * ${headerHeight})`,
  paddingTop: headerHeight,
  background: color.backgroundDark.base,
  color: color.text.primary,
})

export const content = style({
  boxSizing: 'border-box',
  maxWidth: '1600px',
  margin: '0 auto',
  // 헤더 바로 밑에 붙으면 시선이 화면 맨 위로 올라가야 해서 위를 넉넉히 비운다.
  padding: `${spacing[80]} ${sidePadding} 90px`,
  '@media': {
    [breakpoint.mobile]: {
      padding: `${spacing[20]} ${spacing[16]} ${spacing[40]}`,
    },
  },
})

export const layout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[24],
  '@media': {
    [breakpoint.desktop]: {
      gridTemplateColumns: 'minmax(0, 2fr) minmax(340px, 1fr)',
      gap: spacing[40],
    },
  },
})

// 옵션이 많아 오른쪽 컬럼이 더 길다 — 데스크톱에선 이미지가 헤더 밑에 멈춰 있고 옵션만 스크롤된다.
// align-self: start가 없으면 칸이 행 높이만큼 늘어나 sticky가 움직일 여유가 없다.
export const imageColumn = style({
  width: '100%',
  '@media': {
    [breakpoint.desktop]: {
      position: 'sticky',
      top: '96px',
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
      [breakpoint.desktop]: { fontSize: '30px' },
      [breakpoint.mobile]: { fontSize: fontSize[20] },
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
    [breakpoint.desktop]: {
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

// 모바일: 하단 고정 주문바가 겹칠 일이 없어 top은 항상 0.
// 데스크톱: 위에서 내려오는 주문바가 보이면 그 높이(--order-bar-offset)만큼 밀려 겹치지 않는다.
export const tabBarWrapper = style({
  position: 'sticky',
  top: 0,
  zIndex: 1,
  '@media': {
    [breakpoint.desktop]: {
      top: 'var(--order-bar-offset, 0px)',
      transition: `top ${motion.duration.fast} ${motion.easing.default}`,
    },
  },
})

export const sections = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '80px',
  maxWidth: maxWidth.content,
  margin: '0 auto',
  padding: `56px ${sidePadding} 160px`,
  '@media': {
    [breakpoint.mobile]: {
      gap: spacing[50],
      padding: `${spacing[32]} ${spacing[16]} ${spacing[40]}`,
    },
  },
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  // 위에 고정되는 주문바(72px) + 탭(56px)에 가리지 않게 띄운다.
  scrollMarginTop: '140px',
  '@media': {
    // 모바일은 주문바가 하단이라 탭(44px)만 위에 고정된다.
    [breakpoint.mobile]: { scrollMarginTop: '60px' },
  },
})

export const sectionTitle = style([
  typography.title.xlSemibold,
  {
    margin: 0,
    fontWeight: fontWeight.bold,
    '@media': { [breakpoint.mobile]: { fontSize: fontSize[20] } },
  },
])

// ponytail: 탭 콘텐츠 API 전까지 자리표시자 — 상세 이미지가 오면 교체.
export const placeholder = style([
  typography.body.defaultRegular,
  {
    display: 'grid',
    placeItems: 'center',
    height: '520px',
    borderRadius: '20px',
    background: color.background.base,
    border: `1px solid ${color.border.subtle}`,
    color: color.text.tertiary,
    '@media': { [breakpoint.mobile]: { height: '320px' } },
  },
])

export const reviewList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})
