import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@shared/config/theme'
import { headerHeight } from '@widgets/header'

// 어두운 페이지 — 바탕을 헤더 높이만큼 끌어올려 헤더 뒤까지 깔고(data-header-theme="dark"),
// 장면은 헤더 아래부터 화면 끝까지 채운다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  // 모바일은 하단 탭바가 떠 있다 — 버튼이 가려지지 않게 탭바 위에서 끝낸다.
  minHeight: `calc(100vh - ${TAB_BAR_HEIGHT} - ${TAB_BAR_OFFSET})`,
  marginTop: `calc(-1 * ${headerHeight})`,
  paddingTop: headerHeight,
  background: color.backgroundDark.base,
  '@media': {
    [breakpoint.desktop]: { minHeight: '100vh' },
  },
})
