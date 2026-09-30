import { style } from '@vanilla-extract/css'

import { color, spacing, typography, breakpoint } from '@/shared/config/theme'

export const title = style([
  typography.title.xlSemibold,
  { marginBottom: spacing[40] },
])

// 데스크톱에선 주문 폼(왼쪽)과 결제 요약(오른쪽)이 나란히 선다.
export const layout = style({
  display: 'grid',
  rowGap: spacing[40],
  '@media': {
    [breakpoint.desktop]: {
      gridTemplateColumns: 'minmax(0, 1fr) 351px',
      columnGap: spacing[40],
      alignItems: 'start',
    },
  },
})

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[32],
  minWidth: 0,
})

// 섹션 사이 구분선 — 위 gap(32px)과 같은 값을 패딩으로 줘서 선이 두 섹션 한가운데 놓인다.
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  selectors: {
    '&:not(:first-child)': {
      paddingTop: spacing[32],
      borderTop: `1px solid ${color.border.default}`,
    },
  },
})

// 배송지 섹션만 제목 오른쪽에 버튼이 붙는다 — 줄 높이는 버튼(37px)이 정하고 제목이 가운데 선다.
export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const addressManageLink = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    textDecoration: 'none',
    color: color.text.tertiary,
  },
])

export const sectionTitle = typography.title.lgSemibold

// 제목과 안내 문구는 입력 칸(16px)보다 붙어 있어야 한 덩어리로 읽힌다.
export const sectionIntro = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const note = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])

// 이름/휴대폰처럼 한 줄에 둘씩 놓이는 입력 — 모바일에선 한 칸씩 쌓인다.
export const fieldRow = style({
  display: 'flex',
  gap: spacing[12],
  '@media': {
    [breakpoint.mobile]: { flexDirection: 'column' },
  },
})
