import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'
import { headerHeight } from '@widgets/header'

const divider = `1px solid ${color.border.subtle}`
const card = {
  borderRadius: '20px',
  border: divider,
  background: color.background.base,
}

// 나란히 설지는 화면이 아니라 이 탭의 폭으로 정한다 — 왼쪽 메뉴가 붙는 폭에선 화면이 넓어도 좁다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  width: '100%',
  containerType: 'inline-size',
})

const sideBySide = '(min-width: 744px)'

// 마이페이지 탭 제목 — 모바일은 한 단계 줄인다(결제 페이지 제목과 같은 크기).
export const title = style([
  typography.title.xxlSemibold,
  {
    margin: 0,
    // 모바일은 헤더가 같은 제목을 띄운다(getMobileTitle).
    '@media': { [breakpoint.mobile]: { display: 'none' } },
  },
])

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

// 클릭 영역(label)은 내용(체크박스+글자)만큼만 차지한다.
export const selectAll = style([
  typography.body.subSemibold,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[10],
    color: color.text.primary,
    cursor: 'pointer',
    userSelect: 'none',
  },
])

export const selectAllCount = style({ color: color.text.tertiary })

// 상품 목록과 결제 정보(320px)가 나란히 설 폭이 안 되면 결제 정보가 아래로 내려간다.
export const layout = style({
  display: 'grid',
  gap: spacing[24],
  '@container': {
    [sideBySide]: {
      gridTemplateColumns: 'minmax(0, 1fr) 320px',
      alignItems: 'start',
    },
  },
})

export const list = style([
  card,
  {
    minWidth: 0,
    paddingInline: spacing[24],
    paddingBlock: spacing[4],
    '@media': { [breakpoint.mobile]: { paddingInline: spacing[20] } },
  },
])

// 장바구니 한 줄 — 카드 아래에 살 수 없는 이유가 붙을 수 있다.
export const item = style({
  display: 'grid',
  gap: spacing[12],
  paddingBlock: '18px',
  selectors: { '& + &': { borderTop: divider } },
})

// 나란히 설 땐 스크롤해도 결제 버튼이 보이게 헤더 밑에 붙는다.
export const summary = style({
  '@container': {
    [sideBySide]: {
      position: 'sticky',
      top: `calc(${headerHeight} + ${spacing[24]})`,
    },
  },
})

export const empty = style([
  card,
  typography.body.defaultRegular,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[16],
    padding: `64px ${spacing[24]}`,
    color: color.text.tertiary,
    textAlign: 'center',
  },
])

// 불러오는 동안 — 막대 크기는 Cart Skeleton.dc.html을 따르고, 목록·결제 정보 칸은 위 스타일을 그대로 쓴다.
export const skeleton = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  '@media': { [breakpoint.mobile]: { gap: spacing[20] } },
})

export const skeletonSelectAll = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[10],
})

export const skeletonRow = style({
  display: 'flex',
  gap: '14px',
  paddingBlock: '18px',
  selectors: { '& + &': { borderTop: divider } },
  '@media': {
    [breakpoint.mobile]: { gap: spacing[12], paddingBlock: spacing[16] },
  },
})

// 체크박스는 썸네일 높이의 가운데에 온다.
export const skeletonCheck = style({
  flexShrink: 0,
  marginTop: '27px',
  '@media': { [breakpoint.mobile]: { marginTop: '23px' } },
})

// 썸네일과 그 아래 수량 조절기 자리.
export const skeletonThumb = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  width: '76px',
  flexShrink: 0,
  '@media': { [breakpoint.mobile]: { width: '68px' } },
})

export const skeletonInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  flex: 1,
  minWidth: 0,
  paddingTop: '2px',
})

export const skeletonPrice = style({ marginTop: 'auto', alignSelf: 'flex-end' })

export const skeletonSummary = style([
  card,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: spacing[24],
  },
])

export const skeletonSummaryRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const skeletonTotal = style([
  skeletonSummaryRow,
  { paddingTop: '14px', borderTop: divider },
])

// 결제 버튼 자리는 흐르지 않는 판으로 둔다(시안 그대로).
export const skeletonAction = style({
  height: '52px',
  marginTop: '6px',
  borderRadius: '14px',
  background: color.background.surface,
})
