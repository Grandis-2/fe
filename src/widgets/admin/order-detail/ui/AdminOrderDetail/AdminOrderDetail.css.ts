import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 예약 상세(AdminReservationDetail)와 같은 뼈대 — 제목 줄, 지금 할 일, 진행, 두 단.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const titleRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${spacing[12]} ${spacing[16]}`,
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

// 누구의 얼마짜리 주문인지 — 아래로 내리지 않아도 보이게 제목 옆에 한 줄로.
export const summary = style([
  typography.body.defaultRegular,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

// 왼쪽은 넓게 상품·이력, 오른쪽은 좁게 배송지·주문 정보. 좁으면 아래로 내려간다.
export const columns = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[16],
  alignItems: 'flex-start',
})

export const main = style({
  flex: '2 1 560px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const side = style([main, { flex: '1 1 320px' }])

/** 제목이 안에 들어간 흰 카드 */
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
  padding: `${spacing[20]} ${spacing[24]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  minWidth: 0,
})

export const panelHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const panelTitle = style([
  typography.title.mdSemibold,
  { margin: 0, color: color.text.primary },
])

export const panelCount = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const items = style({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const item = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
  padding: `${spacing[12]} 0`,
  selectors: {
    '& + &': { borderTop: `1px solid ${color.border.subtle}` },
  },
})

export const itemName = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const itemOption = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const amount = style([
  typography.body.defaultRegular,
  {
    flexShrink: 0,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const total = style([
  typography.title.mdSemibold,
  {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: spacing[12],
    borderTop: `1px solid ${color.border.default}`,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const list = style({
  display: 'grid',
  gridTemplateColumns: '88px minmax(0, 1fr)',
  alignItems: 'center',
  gap: `${spacing[12]} ${spacing[16]}`,
  margin: 0,
})

export const term = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const value = style([
  typography.body.defaultRegular,
  {
    margin: 0,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
    overflowWrap: 'anywhere',
  },
])

// 긴 id는 한 단계 작게 — 복사해 쓰는 값이라 읽기보다 붙여 넣기용이다.
export const idValue = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    margin: 0,
    color: color.text.secondary,
    overflowWrap: 'anywhere',
  },
])

export const copyButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '32px',
  height: '32px',
  border: 'none',
  borderRadius: '8px',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      background: color.background.subSurface,
      color: color.text.primary,
    },
  },
})

export const copyIcon = style({ width: '14px', height: '14px' })
