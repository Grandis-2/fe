import { style } from '@vanilla-extract/css'

import { searchStyles } from '@features/search'
import {
  breakpoint,
  color,
  onDark,
  spacing,
  typography,
} from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

const { divider, label } = searchStyles

export const root = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '28px',
  maxWidth: '1184px',
  margin: '0 auto',
  padding: `${spacing[32]} clamp(20px, 4vw, 48px) 96px`,
  color: color.text.inverse,
  '@media': {
    [breakpoint.mobile]: {
      gap: spacing[24],
      padding: `${spacing[16]} ${spacing[16]} ${spacing[24]}`,
    },
  },
})

export const header = style({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: `${spacing[8]} ${spacing[16]}`,
  paddingBottom: spacing[16],
  borderBottom: divider,
})

export const heading = style({
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: spacing[10],
  minWidth: 0,
})

export const title = style([
  typography.title.xlSemibold,
  {
    margin: 0,
    overflowWrap: 'anywhere',
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[18] },
    },
  },
])

export const total = style([
  typography.body.defaultRegular,
  {
    color: label,
    whiteSpace: 'nowrap',
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[14] },
    },
  },
])

export const count = style({ color: color.text.inverse, fontWeight: 700 })

export const sorts = style({
  display: 'flex',
  gap: spacing[4],
  // 모바일은 버튼 여백만큼 바깥으로 빼 글자를 왼쪽 선에 맞춘다.
  '@media': {
    [breakpoint.mobile]: { marginLeft: `-${spacing[10]}` },
  },
})

export const sort = style([
  typography.body.sub,
  {
    height: '32px',
    padding: `0 ${spacing[10]}`,
    border: 'none',
    background: 'transparent',
    color: onDark(55),
    cursor: 'pointer',
    selectors: {
      '&[aria-pressed="true"]': { color: color.text.inverse, fontWeight: 700 },
    },
  },
])

// 카테고리 둘러보기 제목(모바일 › Apple › 스마트폰)의 구분 화살표 — 글자 크기를 따라간다.
export const chevron = style({
  width: '0.8em',
  height: '0.8em',
  margin: `0 ${spacing[4]}`,
  verticalAlign: '-0.05em',
  color: label,
})

export const cardGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
  gap: spacing[24],
  '@media': {
    // 모바일은 2열 — minmax(0, …)로 두어야 카드 내용이 열 폭을 밀어내지 않는다.
    [breakpoint.mobile]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: spacing[12],
    },
  },
})
