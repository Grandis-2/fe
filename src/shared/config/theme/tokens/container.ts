import { spacing } from './spacing'

export const maxWidth = {
  none: 'none',
  content: '1200px',
  full: '100%',
} as const

// 모바일 하단 플로팅 탭바(widgets/mobile-tab-bar) 크기. 탭바가 가리지 않게 그만큼 비워야 하는
// 곳이 shared(BottomSheet)에도 있어서 widgets가 아니라 여기 둔다.
export const TAB_BAR_HEIGHT = '60px'
// 화면 아래 끝에서 띄우는 간격. iOS 홈 인디케이터 영역만큼 더 띄운다.
export const TAB_BAR_OFFSET = `calc(${spacing[12]} + env(safe-area-inset-bottom))`
