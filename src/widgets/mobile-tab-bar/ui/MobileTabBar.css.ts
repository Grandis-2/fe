import { style } from '@vanilla-extract/css'

import { color, motion, spacing } from '@/shared/config/theme'
import { breakpoint } from '@/shared/config/theme/tokens/breakpoint'

// 탭바 높이 — 페이지가 마지막 콘텐츠를 탭바 밑에 가리지 않게 여백을 줄 때도 쓴다(MainLayout.css).
export const TAB_BAR_HEIGHT = '64px'
// 화면 아래 끝에서 띄우는 간격. iOS 홈 인디케이터 영역만큼 더 띄운다.
export const TAB_BAR_OFFSET = `calc(${spacing[12]} + env(safe-area-inset-bottom))`

export const root = style({
  position: 'fixed',
  left: spacing[16],
  right: spacing[16],
  bottom: TAB_BAR_OFFSET,
  // 헤더(10)와 같은 층 — 메가 메뉴 딤(5)보다 위, 바텀시트 포털(나중에 붙음)보다 아래.
  zIndex: 10,
  // left/right + maxWidth + margin auto — 좁은 화면에선 좌우 16px 띄우고, 넓어지면 300px로 가운데.
  maxWidth: '300px',
  margin: '0 auto',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: TAB_BAR_HEIGHT,
  padding: spacing[6],
  borderRadius: '999px',
  background: color.backgroundDark.base,
  border: `1px solid ${color.backgroundDark.surface}`,
  '@media': {
    [breakpoint.desktop]: { display: 'none' },
  },
})

export const tab = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: 0,
  border: 'none',
  borderRadius: '999px',
  background: 'transparent',
  // 아이콘은 currentColor로 이 색을 상속한다(CLAUDE.md의 lucide-react 참고).
  color: color.text.inverse,
  cursor: 'pointer',
  transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&[aria-current="page"], &[aria-expanded="true"]': {
      background: color.primary.base,
    },
  },
})

export const icon = style({
  width: '24px',
  height: '24px',
})

export const sheetTitle = style({
  marginBottom: spacing[20],
  color: color.text.primary,
})
