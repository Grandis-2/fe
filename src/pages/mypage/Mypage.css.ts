import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  glowBackground,
  spacing,
} from '@shared/config/theme'
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

// 넓은 화면은 왼쪽 메뉴 + 오른쪽 내용, 좁은 화면은 위에서 아래로 쌓인다.
export const layout = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  '@media': {
    [breakpoint.desktop]: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing[40],
    },
  },
})

export const content = style({
  flex: 1,
  minWidth: 0,
})
