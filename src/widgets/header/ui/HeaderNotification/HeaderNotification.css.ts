import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'

import { DARK_HEADER_PADDING_X } from '../../model/layout'

// 기준 박스는 헤더(Header.css의 root) — 벨 버튼이 아니라 헤더 오른쪽 끝에 맞춰야
// 모바일에서 벨 왼쪽으로 화면 밖까지 밀려나지 않는다. 오른쪽 여백은 헤더 내용의 좌우 여백과 같다.
// 바탕·글자는 data-theme="dark"로 어두운 토큰을 쓴다(헤더는 페이지 테마 밖에 있다).
export const panel = style({
  position: 'absolute',
  top: '100%',
  right: DARK_HEADER_PADDING_X,
  // 상품 상세의 sticky 바(z-index 2)보다 위 — CategoryNav 메가 메뉴와 같은 값이다.
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  width: '380px',
  maxHeight: 'min(520px, 70vh)',
  marginTop: spacing[8],
  boxSizing: 'border-box',
  borderRadius: '16px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  color: color.text.primary,
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
  '@media': {
    [breakpoint.mobile]: {
      right: spacing[12],
      width: `calc(100% - 2 * ${spacing[12]})`,
    },
  },
})

export const title = style([
  typography.title.smMedium,
  {
    padding: `${spacing[16]} ${spacing[20]}`,
    borderBottom: `1px solid ${color.border.subtle}`,
  },
])
