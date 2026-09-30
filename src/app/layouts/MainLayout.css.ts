import { style } from '@vanilla-extract/css'

import { color } from '@/shared/config/theme'
import { breakpoint } from '@/shared/config/theme/tokens/breakpoint'
import {
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@/shared/config/theme/tokens/container'
import { headerHeight } from '@/widgets/header'

// admin 레이아웃(AdminLayout.css.ts)과 같은 이유로 헤더 높이만큼 뺀다 — 콘텐츠가
// 뷰포트보다 짧아도 배경이 끝까지 채워지게 하는 최소 높이일 뿐, 콘텐츠가 더 길면
// 자연스럽게 늘어난다(admin처럼 내부 스크롤로 가두지 않는다).
export const root = style({
  minHeight: `calc(100vh - ${headerHeight})`,
  background: color.background.page,
  // 모바일은 하단 플로팅 탭바가 마지막 콘텐츠를 가리지 않게 그 높이+띄운 간격만큼 비워 둔다.
  '@media': {
    [breakpoint.mobile]: {
      paddingBottom: `calc(${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET})`,
    },
  },
})

export const baseBackground = style({
  background: color.background.base,
})
