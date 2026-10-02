import { globalStyle, style } from '@vanilla-extract/css'

import { spacing, typography, color, breakpoint } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  '@media': {
    [breakpoint.desktop]: {
      gap: spacing[40],
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
  },
})

export const content = style({
  flex: 1,
  minWidth: 0,
})

export const title = style([
  typography.title.xlSemibold,
  {
    marginBottom: spacing[40],
    padding: '12px 0px 12px 4px',
    borderBottom: `2px solid ${color.primary.focus}`,
    '@media': {
      // 모바일은 위 탭이 현재 위치를 이미 보여준다.
      [breakpoint.mobile]: { display: 'none' },
    },
  },
])

export const desktopOnly = style({
  '@media': {
    [breakpoint.mobile]: { display: 'none' },
  },
})

export const mobileHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  '@media': {
    [breakpoint.desktop]: { display: 'none' },
  },
})

export const mobileUserName = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

// SegmentedTabs 기본값(fit-content)을 덮어 화면 폭을 4칸이 똑같이 나눠 갖게 한다.
export const mobileTabs = style({
  boxSizing: 'border-box',
  width: '100%',
})

// 기본 좌우 패딩(14px)이면 320px 폭에서 4칸이 넘쳐 페이지가 가로로 밀린다.
globalStyle(`${mobileTabs} > button`, {
  flex: 1,
  paddingInline: spacing[4],
})
