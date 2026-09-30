import { style } from '@vanilla-extract/css'

import { color, spacing } from '@/shared/config/theme'
import { breakpoint } from '@/shared/config/theme/tokens/breakpoint'
import {
  maxWidth,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@/shared/config/theme/tokens/container'

// 포털이 body 끝에 붙어도 z-index가 없으면 z-index를 가진 요소(상품 카드 Swiper 1,
// 헤더 10, 탭바 12, 드롭다운·메가 메뉴 20~21)가 시트 위로 올라온다 — 그 전부보다 위.
const SHEET_Z_INDEX = 30

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: SHEET_Z_INDEX,
  background: 'rgba(0, 0, 0, 0.5)',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
})

export const content = style({
  position: 'fixed',
  zIndex: SHEET_Z_INDEX,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  maxWidth: maxWidth.content,
  margin: '0 auto',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh',
  // 윗여백은 handle이 자기 margin으로 갖는다 — padding prop을 0으로 줘도 handle은 안 붙는다.
  padding: `0 ${spacing[16]} ${spacing[16]}`,
  background: color.background.base,
  borderTopLeftRadius: '16px',
  borderTopRightRadius: '16px',
})

// 모바일은 하단 탭바(zIndex 31)가 시트 위에 떠 있어 마지막 버튼을 가린다 — 그만큼 비운다.
// padding이 아니라 빈 요소인 이유: 호출부가 padding prop(인라인)을 줘도 이 여백은 남아야 한다.
export const tabBarSpacer = style({
  flexShrink: 0,
  display: 'none',
  '@media': {
    [breakpoint.mobile]: {
      display: 'block',
      height: `calc(${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET})`,
    },
  },
})

export const handle = style({
  width: '40px',
  height: '4px',
  margin: `${spacing[16]} auto`,
  borderRadius: '4px',
  background: color.border.default,
})
