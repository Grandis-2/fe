import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
  marginBottom: spacing[30],
  padding: `0 ${spacing[8]}`,
  '@media': {
    // 경로(모바일 > Apple > 스마트폰)가 길어지면 정렬 드롭다운이 아래 줄로 내려간다.
    [breakpoint.mobile]: {
      flexWrap: 'wrap',
      marginBottom: spacing[16],
      padding: 0,
    },
  },
})

export const titleRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing[12],
})

export const title = style([
  typography.title.xlSemibold,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    whiteSpace: 'nowrap',
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[18] },
    },
  },
])

// 아이콘 크기를 글자 크기에 맞춘다.
export const chevron = style({
  width: '1em',
  height: '1em',
})

export const total = style([
  typography.body.sub,
  { color: color.text.tertiary, whiteSpace: 'nowrap' },
])

export const cardGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
  gap: spacing[24],
  paddingBottom: spacing[100],
  '@media': {
    // 모바일은 2열 — minmax(0, …)로 두어야 카드 내용이 열 폭을 밀어내지 않는다.
    // 아래 탭바 자리는 MainLayout이 이미 비워 두므로 데스크톱용 100px 여백은 줄인다.
    [breakpoint.mobile]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: spacing[12],
      paddingBottom: spacing[24],
    },
  },
})
