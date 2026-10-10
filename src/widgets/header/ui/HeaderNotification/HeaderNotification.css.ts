import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  spacing,
  typography,
} from '@shared/config/theme'

// 기준 박스는 헤더(Header.css의 root) — 벨 버튼이 아니라 헤더 오른쪽 끝에 맞춰야
// 모바일에서 벨 왼쪽으로 화면 밖까지 밀려나지 않는다.
// 바탕·글자는 data-theme="dark"로 어두운 토큰을 쓴다(헤더는 페이지 테마 밖에 있다).
export const panel = style({
  position: 'absolute',
  top: '100%',
  right: '48px',
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

export const list = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  overflowY: 'auto',
})

export const item = style({
  display: 'grid',
  gridTemplateColumns: `${spacing[8]} minmax(0, 1fr)`,
  columnGap: spacing[12],
  padding: `${spacing[16]} ${spacing[20]}`,
  color: 'inherit',
  textDecoration: 'none',
  transition: `background-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    'a&:hover, a&:focus-visible': { background: color.background.surface },
    'li + li > &': { borderTop: `1px solid ${color.border.subtle}` },
  },
})

// 안 읽은 알림 앞의 점. 읽은 알림은 자리만 남겨 글자 줄을 맞춘다.
export const unreadDot = style({
  width: spacing[8],
  height: spacing[8],
  marginTop: spacing[6],
  borderRadius: '50%',
  background: color.primary.subtle,
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const itemHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const itemTitle = typography.body.subSemibold

export const read = style({ color: color.text.tertiary })

export const message = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const time = style([
  typography.body.caption,
  { flexShrink: 0, color: color.text.tertiary },
])

export const status = style([
  typography.body.sub,
  {
    padding: `${spacing[32]} ${spacing[20]}`,
    textAlign: 'center',
    color: color.text.tertiary,
  },
])
