import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'
import {
  fontSize,
  lineHeight,
} from '@shared/config/theme/tokens/typography/base'

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

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

// SelectButton small을 알약 모양 필터로 키운다(주문 내역 필터와 같은 모양).
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
  typography.body.defaultRegular,
  {
    padding: `64px ${spacing[24]}`,
    borderRadius: '20px',
    border: `1px solid ${color.border.subtle}`,
    background: color.background.base,
    color: color.text.tertiary,
    textAlign: 'center',
  },
])

// HistoryCard 안쪽 여백과 맞춘다.
export const reviewArea = style({
  paddingInline: spacing[24],
  paddingBottom: spacing[20],
  '@media': { [breakpoint.mobile]: { paddingInline: spacing[20] } },
})

// 카드보다 한 단계 어둡게 파인 칸 — 상품 정보와 내가 쓴 글이 갈려 보인다.
export const review = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  padding: `${spacing[16]} 18px`,
  borderRadius: '14px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.page,
})

export const reviewMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[10],
})

export const stars = style({
  fontSize: fontSize[16],
  letterSpacing: '1px',
  color: color.status.warning,
})

export const starsEmpty = style({ color: color.border.default })

export const reviewDate = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const reviewText = style([
  typography.body.defaultRegular,
  { lineHeight: lineHeight[150], textWrap: 'pretty' },
])

// 버튼 둘을 반씩 나눈다.
export const actions = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: spacing[8],
})
