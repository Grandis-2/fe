import { style, styleVariants } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

const card = {
  borderRadius: '20px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
}

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
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

export const count = style({ color: color.primary.subtle })

// 상태별 건수 네 칸 — 칸 사이만 세로선으로 가른다.
export const summary = style([
  card,
  {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    margin: 0,
    padding: `${spacing[24]} ${spacing[8]}`,
  },
])

export const summaryItem = style({
  display: 'flex',
  flexDirection: 'column-reverse',
  alignItems: 'center',
  gap: spacing[6],
  selectors: {
    '& + &': { borderLeft: `1px solid ${color.border.subtle}` },
  },
})

export const summaryLabel = style([
  typography.body.sub,
  { color: color.text.tertiary, textAlign: 'center' },
])

const summaryValueBase = {
  margin: 0,
  fontSize: '26px',
  fontWeight: fontWeight.bold,
  lineHeight: 1.2,
}

// 0건은 흐리게, 구매 확정 대기는 해야 할 일이라 경고색으로 띄운다.
export const summaryValue = styleVariants({
  default: { ...summaryValueBase, color: color.text.primary },
  warning: { ...summaryValueBase, color: color.status.warning },
  empty: { ...summaryValueBase, color: color.text.disabled },
})

export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

// SelectButton small을 알약 모양 필터로 키운다 — 고르기 전에도 테두리가 보인다.
export const chip = style([
  typography.body.subMedium,
  {
    height: '38px',
    padding: `0 ${spacing[16]}`,
    borderRadius: '19px',
    border: `1.5px solid ${color.border.default}`,
    color: color.text.secondary,
  },
])

export const empty = style([
  card,
  typography.body.defaultRegular,
  {
    padding: `64px ${spacing[24]}`,
    color: color.text.tertiary,
    textAlign: 'center',
  },
])

export const totalRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const totalLabel = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const totalValue = style([
  typography.body.defaultMedium,
  { fontSize: fontSize[18], fontWeight: fontWeight.bold, whiteSpace: 'nowrap' },
])

// 버튼이 하나면 꽉 차고, 둘이면 반씩 나눈다.
export const actions = style({
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'minmax(0, 1fr)',
  gap: spacing[8],
})
