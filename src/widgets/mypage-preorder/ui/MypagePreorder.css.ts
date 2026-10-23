import { style, styleVariants } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

const divider = `1px solid ${color.border.subtle}`
// HistoryCard 안쪽 여백과 맞춘다.
const padX = {
  paddingInline: spacing[24],
  '@media': { [breakpoint.mobile]: { paddingInline: spacing[20] } },
}

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[32],
  width: '100%',
})

// 마이페이지 탭 제목 — 모바일은 한 단계 줄인다(결제 페이지 제목과 같은 크기).
export const title = style([
  typography.title.xxlSemibold,
  {
    margin: 0,
    // 모바일은 헤더가 같은 제목을 띄운다(getMobileTitle).
    '@media': { [breakpoint.mobile]: { display: 'none' } },
  },
])

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const sectionTitle = style([
  typography.body.defaultMedium,
  { margin: 0, fontSize: '17px', fontWeight: fontWeight.bold },
])

// 사전예약 목록(PreorderList)의 상태 칩과 같은 모양.
export const tabs = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
  marginBottom: spacing[8],
})

// 버튼 둘을 반씩 나눈다.
export const actions = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: spacing[8],
})

export const facts = style([
  padX,
  {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: spacing[12],
    margin: 0,
    paddingBlock: spacing[20],
    borderTop: divider,
  },
])

export const fact = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
  minWidth: 0,
})

export const factLabel = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const factValue = style([
  typography.body.defaultMedium,
  {
    margin: 0,
    fontSize: '15px',
    '@media': { [breakpoint.mobile]: { fontSize: fontSize[14] } },
  },
])

export const steps = style([
  padX,
  {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: spacing[12],
    margin: 0,
    paddingTop: 0,
    paddingBottom: spacing[20],
    listStyle: 'none',
  },
])

export const step = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  minWidth: 0,
})

const barBase = { height: '4px', borderRadius: '999px' }

export const bar = styleVariants({
  done: { ...barBase, background: color.primary.subtle },
  todo: { ...barBase, background: color.border.default },
})

export const stepLabel = styleVariants({
  done: [typography.body.caption, { fontWeight: fontWeight.bold }],
  todo: [typography.body.caption, { color: color.text.tertiary }],
})

export const alerts = style([
  padX,
  {
    margin: 0,
    paddingBlock: spacing[4],
    listStyle: 'none',
    borderRadius: '20px',
    border: divider,
    background: color.background.base,
  },
])

export const alert = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[16],
  paddingBlock: spacing[16],
  selectors: { '& + &': { borderTop: divider } },
})

export const alertTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
  flex: 1,
  minWidth: 0,
})

export const alertTitle = style([
  typography.body.defaultMedium,
  { fontSize: '15px', fontWeight: fontWeight.bold },
])

export const alertDate = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

// SelectButton small에 테두리를 둘러 꺼진 상태도 버튼으로 읽히게 한다.
// 테두리·배경 없이 벨 아이콘만 — 켜져 있으면 브랜드색, 꺼져 있으면 흐리게.

// 다음 쪽을 못 받았을 때 목록 아래 — 안내와 다시 불러오기 버튼.
export const retry = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[12],
})
