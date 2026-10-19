import { style, styleVariants } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  onDark,
  spacing,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
  typography,
} from '@shared/config/theme'
import { headerHeight } from '@widgets/header'

const fill = style({ display: 'flex', flexDirection: 'column' })

// placement별 높이 — ErrorScreen이 이 높이를 채운다.
export const placement = styleVariants({
  // 사용자 헤더 아래: 바탕을 헤더 뒤까지 끌어올리고(data-header-theme="dark") 장면은 헤더 아래부터.
  page: [
    fill,
    {
      boxSizing: 'border-box',
      minHeight: '100vh',
      marginTop: `calc(-1 * ${headerHeight})`,
      paddingTop: headerHeight,
      background: color.backgroundDark.base,
      // 모바일은 하단 탭바가 떠 있다 — 버튼이 가려지지 않게 탭바 위에서 끝낸다.
      '@media': {
        [breakpoint.mobile]: {
          minHeight: `calc(100vh - ${TAB_BAR_HEIGHT} - ${TAB_BAR_OFFSET})`,
        },
      },
    },
  ],
  standalone: [fill, { minHeight: '100vh' }],
  // 관리자 본문 자리 — 헤더 아래 남은 높이만.
  inset: [fill, { minHeight: `calc(100vh - ${headerHeight})` }],
})

export const trace = style([typography.body.sub, { color: onDark(64) }])

// 문의 때 그대로 옮겨 적을 수 있게 한 번에 선택되고, 길어도 줄바꿈된다.
export const traceId = style({
  marginLeft: spacing[4],
  color: onDark(85),
  userSelect: 'all',
  wordBreak: 'break-all',
})
