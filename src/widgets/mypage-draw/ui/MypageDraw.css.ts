import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  width: '100%',
})

// 제목 줄 — 오른쪽에 진행 중인 회차 목록으로 가는 링크.
export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: `${spacing[8]} ${spacing[16]}`,
})

// 마이페이지 탭 제목 — 모바일은 한 단계 줄인다(다른 탭 제목과 같은 크기).
export const title = style([
  typography.title.xxlSemibold,
  {
    margin: 0,
    // 모바일은 헤더가 같은 제목을 띄운다(getMobileTitle).
    '@media': { [breakpoint.mobile]: { display: 'none' } },
  },
])

export const listLink = style([
  typography.body.sub,
  {
    color: color.text.tertiary,
    textDecoration: 'none',
    selectors: { '&:hover': { color: color.text.primary } },
  },
])

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

export const count = style({
  marginLeft: spacing[4],
  color: color.primary.subtle,
})

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

export const row = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const rowLabel = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const rowValue = style([
  typography.body.sub,
  { color: color.text.secondary, whiteSpace: 'nowrap' },
])
