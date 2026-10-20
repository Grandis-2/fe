import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  FIXED_BOTTOM_BAR_VAR,
  motion,
  onDark,
  spacing,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@shared/config/theme'

const bottomBar = `var(${FIXED_BOTTOM_BAR_VAR}, 0px)`

// 사용자 페이지는 늘 어두워서 어두운 색으로 고정한다(ScrollArrows와 같은 모양).
// 하단 고정 바(상품 상세 결제 바)·모바일 탭바 위에 뜨고, 바텀시트(30)·탭바(31)보다는 아래다.
export const root = style({
  position: 'fixed',
  right: spacing[24],
  bottom: `calc(${bottomBar} + ${spacing[24]})`,
  zIndex: 20,
  display: 'grid',
  placeItems: 'center',
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: `1px solid ${onDark(18)}`,
  background: color.backgroundDark.surface,
  color: color.text.inverse,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
  cursor: 'pointer',
  // 숨어 있을 땐 visibility로 탭 순서·스크린 리더에서도 뺀다.
  opacity: 0,
  visibility: 'hidden',
  transform: `translateY(${spacing[8]})`,
  transition: [
    `opacity ${motion.duration.fast} ${motion.easing.default}`,
    `transform ${motion.duration.fast} ${motion.easing.default}`,
    `visibility ${motion.duration.fast}`,
    `background ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:hover': { background: onDark(10) },
  },
  '@media': {
    [breakpoint.mobile]: {
      right: spacing[16],
      bottom: `calc(max(calc(${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET}), ${bottomBar}) + ${spacing[12]})`,
    },
    '(prefers-reduced-motion: reduce)': { transform: 'none' },
  },
})

export const visible = style({
  opacity: 1,
  visibility: 'visible',
  transform: 'none',
})
