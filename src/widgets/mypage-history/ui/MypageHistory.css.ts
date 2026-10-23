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
  '@media': { [breakpoint.mobile]: { gap: spacing[16] } },
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

// 상태별 건수 네 칸 — 칸 사이만 세로선으로 가른다.
export const summary = style([
  card,
  {
    display: 'grid',
    // 요약 칸 수만큼 같은 폭으로 나눈다.
    gridAutoFlow: 'column',
    gridAutoColumns: 'minmax(0, 1fr)',
    margin: 0,
    padding: `${spacing[24]} ${spacing[8]}`,
    // 모바일은 칩에 건수를 붙이므로 요약 칸을 숨긴다.
    '@media': { [breakpoint.mobile]: { display: 'none' } },
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

// 0건은 가장 흐리게, 결제 대기는 해야 할 일이라 경고색으로 띄우고, 취소 완료는 한 단계 흐리게 둔다.
export const summaryValue = styleVariants({
  default: { ...summaryValueBase, color: color.text.primary },
  warning: { ...summaryValueBase, color: color.status.warning },
  muted: { ...summaryValueBase, color: color.text.tertiary },
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
  {
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
    whiteSpace: 'nowrap',
    '@media': {
      [breakpoint.mobile]: {
        fontSize: fontSize[16],
        fontWeight: fontWeight.semibold,
      },
    },
  },
])

// 버튼이 하나면 꽉 차고, 둘이면 반씩 나눈다.
export const actions = style({
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'minmax(0, 1fr)',
  gap: spacing[8],
})

// 칩 옆 건수 — 모바일에서만 보인다(데스크톱은 요약 칸이 건수를 보여 준다). 색·간격은 Chip의 count와 맞춘다.
export const chipCount = style({
  display: 'none',
  marginLeft: spacing[6],
  color: color.primary.subtle,
  fontVariantNumeric: 'tabular-nums',
  '@media': { [breakpoint.mobile]: { display: 'inline' } },
})

// 받는 사람·배송지 — 사전예약 내역 카드의 facts와 같은 모양. 주소가 길어 배송지 칸을 넓게 준다.
export const facts = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 3fr)',
  gap: spacing[12],
  margin: 0,
  padding: `${spacing[20]} ${spacing[24]}`,
  borderTop: `1px solid ${color.border.subtle}`,
  '@media': {
    [breakpoint.mobile]: { padding: spacing[16] },
  },
})

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

// 다음 쪽을 못 받았을 때 목록 아래 — 안내와 다시 불러오기 버튼.
export const retry = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[12],
})

// 취소 완료 주문은 끝난 일이라 PreorderCard·DrawCard의 마감 카드처럼 흐리게 둔다.
export const canceledCard = style({ opacity: 0.55 })
