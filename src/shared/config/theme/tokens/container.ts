import { spacing } from './spacing'

export const maxWidth = {
  none: 'none',
  content: '1200px',
  full: '100%',
} as const

// 관리자 등록·수정 폼(상품·사전예약)의 최대 폭. 화면마다 폼 폭이 달라 보이지 않게 한 값을 같이 쓴다.
export const ADMIN_FORM_MAX_WIDTH = '1368px'

// 모바일 하단 플로팅 탭바(widgets/mobile-tab-bar) 크기. 탭바가 가리지 않게 그만큼 비워야 하는
// 곳이 shared(BottomSheet)에도 있어서 widgets가 아니라 여기 둔다.
export const TAB_BAR_HEIGHT = '60px'
// 화면 아래 끝에서 띄우는 간격. iOS 홈 인디케이터 영역만큼 더 띄운다.
export const TAB_BAR_OFFSET = `calc(${spacing[12]} + env(safe-area-inset-bottom))`

// 탭바보다 높은 하단 고정 바(상품 상세 결제 바)가 자기 높이를 적어 두는 CSS 변수.
// 레이아웃이 맨 아래(푸터 밑)를 이만큼 비워 바가 푸터를 가리지 않게 한다.
export const FIXED_BOTTOM_BAR_VAR = '--fixed-bottom-bar-height'
