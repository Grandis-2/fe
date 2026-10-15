import { style } from '@vanilla-extract/css'

import {
  color,
  breakpoint,
  FIXED_BOTTOM_BAR_VAR,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@shared/config/theme'
import { headerHeight } from '@widgets/header'

// admin 레이아웃(AdminLayout.css.ts)과 같은 이유로 헤더 높이만큼 뺀다 — 콘텐츠가
// 뷰포트보다 짧아도 배경이 끝까지 채워지게 하는 최소 높이일 뿐, 콘텐츠가 더 길면
// 자연스럽게 늘어난다(admin처럼 내부 스크롤로 가두지 않는다).
export const root = style({
  // 콘텐츠가 짧아도 Footer가 화면 맨 아래에 붙게 content가 남는 높이를 채운다.
  display: 'flex',
  flexDirection: 'column',
  minHeight: `calc(100vh - ${headerHeight})`,
  background: color.background.page,
  // 모바일은 하단 플로팅 탭바가 마지막 콘텐츠(푸터)를 가리지 않게 그 높이+띄운 간격만큼 비워 둔다.
  // 탭바보다 높은 고정 바(상품 상세 결제 바)가 있으면 그 높이만큼 비운다.
  '@media': {
    [breakpoint.mobile]: {
      paddingBottom: `max(calc(${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET}), var(${FIXED_BOTTOM_BAR_VAR}, 0px))`,
    },
  },
})

// 페이지를 flex item으로 바로 두면 margin: auto로 가운데 정렬한 페이지(404 등)가 폭이
// 줄어든다 — 블록 래퍼 안에 두어 페이지 쪽 레이아웃은 그대로 둔다.
export const content = style({ flex: 1 })

export const baseBackground = style({
  background: color.background.base,
})

export const darkBackground = style({
  background: color.backgroundDark.base,
})

export const transparentBackground = style({
  background: 'transparent',
})

export const withoutHeader = style({
  minHeight: '100vh',
  '@media': {
    [breakpoint.mobile]: {
      paddingBottom: 0,
    },
  },
})
