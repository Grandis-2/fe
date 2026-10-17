import { style } from '@vanilla-extract/css'

import { breakpoint, glowBackground } from '@shared/config/theme'
import { headerHeight } from '@widgets/header'

// 헤더가 투명이라 바탕을 헤더 높이만큼 끌어올려 헤더 뒤까지 빛이 이어지게 한다.
export const root = style({
  boxSizing: 'border-box',
  minHeight: '100vh',
  marginTop: `calc(-1 * ${headerHeight})`,
  paddingTop: headerHeight,
  background: glowBackground.desktop,
  '@media': {
    [breakpoint.mobile]: { background: glowBackground.mobile },
  },
})
