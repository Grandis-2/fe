import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'
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
    '@media': { [breakpoint.mobile]: { fontSize: fontSize[24] } },
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

export const item = style({
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
