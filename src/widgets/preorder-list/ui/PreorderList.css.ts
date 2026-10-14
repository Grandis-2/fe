import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'

// 어두운 사전예약 페이지 전용 — 테마와 상관없이 흰 글자(onDark)를 쓴다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[30],
  color: color.text.inverse,
  '@media': {
    [breakpoint.mobile]: { gap: spacing[16] },
  },
})

// 제목 아래에 상태 칩.
export const header = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: spacing[16],
})

export const title = style([
  typography.title.xxlSemibold,
  {
    margin: 0,
    // 모바일은 헤더가 같은 제목을 띄운다(getMobileTitle).
    '@media': {
      [breakpoint.mobile]: { display: 'none' },
    },
  },
])

export const tabs = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

// 웹 3열, 모바일 1열(카드가 가로형 4:3으로 바뀐다).
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: spacing[20],
  '@media': {
    [breakpoint.mobile]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: spacing[14],
    },
  },
})
