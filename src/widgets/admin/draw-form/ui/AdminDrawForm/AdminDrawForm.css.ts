import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 왼쪽은 넓게 입력, 오른쪽은 좁게 "만들기 전에 확인". 좁으면 요약이 아래로 내려간다.
export const root = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: spacing[16],
})

export const fields = style({
  flex: '2 1 560px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

// 스크롤해도 요약과 만들기 버튼이 보이게 붙여 둔다.
export const aside = style({
  flex: '1 1 320px',
  minWidth: 0,
  position: 'sticky',
  top: spacing[20],
})

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

// 보낼 내용을 끝까지 보며 누르는 자리라 테두리를 브랜드 색으로 띄운다.
export const summaryPanel = style([
  panel,
  { borderColor: color.primary.subtle },
])

export const panelTitle = style([
  typography.title.mdSemibold,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[10],
    margin: 0,
    color: color.text.primary,
  },
])

// 채울 순서 — 1~4.
export const stepNo = style([
  typography.body.captionMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: color.primary.subtler,
    color: color.primary.base,
  },
])

export const description = style([
  typography.body.sub,
  { margin: 0, color: color.text.secondary },
])

// 두 칸을 나란히 두고, 좁은 화면에선 위아래로 쌓는다.
export const pair = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: `${spacing[12]} ${spacing[16]}`,
})

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  minWidth: 0,
})

export const hint = style([
  typography.body.caption,
  { color: color.text.secondary },
])

export const counter = style([
  typography.body.caption,
  {
    alignSelf: 'flex-end',
    color: color.text.tertiary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const quick = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[8],
})

export const alertAction = style({
  marginTop: spacing[8],
})

export const list = style({
  display: 'grid',
  gridTemplateColumns: '88px minmax(0, 1fr)',
  gap: `${spacing[10]} ${spacing[14]}`,
  margin: 0,
})

export const term = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const value = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    margin: 0,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
    overflowWrap: 'anywhere',
  },
])

export const valueNote = style([
  typography.body.caption,
  { color: color.text.secondary },
])

export const actions = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})
