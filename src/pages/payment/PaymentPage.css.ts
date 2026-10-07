import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  glowBackground,
  motion,
  spacing,
  typography,
} from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'
import { headerHeight } from '@widgets/header'

// 어두운 페이지 — 헤더 높이만큼 끌어올려 헤더 뒤까지 빛이 이어지게 한다(data-header-theme="dark").
export const root = style({
  boxSizing: 'border-box',
  minHeight: '100vh',
  marginTop: `calc(-1 * ${headerHeight})`,
  paddingTop: headerHeight,
  background: glowBackground.desktop,
  color: color.text.primary,
  '@media': {
    [breakpoint.mobile]: { background: glowBackground.mobile },
  },
})

// 모바일은 title.xlSemibold 크기로 한 단계 줄인다.
export const title = style([
  typography.title.xxlSemibold,
  {
    marginBottom: spacing[40],
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[24] },
    },
  },
])

// 두 칸은 왼쪽 폼이 숨 쉴 폭이 나올 때만 — 배너(Banner.css.ts)와 같은 1025px 기준.
// 그보다 좁으면 결제 요약이 폼 아래로 쌓인다.
const sideBySide = '(min-width: 1025px)'

// 넓은 화면에선 주문 폼(왼쪽)과 결제 요약(오른쪽)이 나란히 선다.
// 오른쪽도 폭의 32%를 따라 320~380px 사이에서 같이 줄어든다.
export const layout = style({
  display: 'grid',
  rowGap: spacing[40],
  '@media': {
    [sideBySide]: {
      gridTemplateColumns: 'minmax(0, 1fr) clamp(320px, 32%, 380px)',
      columnGap: spacing[40],
      alignItems: 'start',
    },
  },
})

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  minWidth: 0,
})

// 섹션마다 카드 한 장 — 입력 칸(background.page)이 카드보다 한 단계 어둡게 파여 보인다.
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: '28px',
  borderRadius: '20px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
  '@media': {
    [breakpoint.mobile]: { padding: spacing[20] },
  },
})

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const addressManageLink = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[6],
    textDecoration: 'none',
    color: color.text.tertiary,
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { color: color.text.primary },
    },
  },
])

export const sectionTitle = typography.title.mdSemibold

// 제목과 안내 문구는 입력 칸(16px)보다 붙어 있어야 한 덩어리로 읽힌다.
export const sectionIntro = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const note = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

// 이름/휴대폰처럼 한 줄에 둘씩 놓이는 입력 — 칸이 240px보다 좁아지면 한 칸씩 쌓인다.
export const fieldRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
  gap: spacing[12],
})

// 라벨이 입력 위에 붙는 stacked 칸이라 버튼은 아래(입력 상자)에 맞춘다.
export const addressRow = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: spacing[10],
})

export const addressAction = style({ flexShrink: 0 })

// 스크롤해도 결제 버튼이 보이게 두 칸일 땐 헤더 밑에 붙는다.
export const summary = style({
  '@media': {
    [sideBySide]: {
      position: 'sticky',
      top: `calc(${headerHeight} + ${spacing[24]})`,
    },
  },
})
