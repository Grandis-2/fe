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
    '@media': { [breakpoint.mobile]: { fontSize: fontSize[24] } },
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

export const count = style({ color: color.primary.subtle })

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
  { margin: 0, fontSize: '15px', fontWeight: fontWeight.bold },
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
  gap: '3px',
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
export const alertToggle = style({
  flexShrink: 0,
  height: '34px',
  padding: `0 ${spacing[14]}`,
  borderRadius: '10px',
  border: `1px solid ${color.border.default}`,
  background: color.background.surface,
  color: color.text.secondary,
  whiteSpace: 'nowrap',
})
