import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

// 카드가 아니라 목록 한 줄 — 감싸는 쪽(할 일 카드·맨 위 긴급 줄)이 테두리를 맡는다.
// 급한 정도는 앞의 꼬리표 색과 글자로 보인다.
export const root = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  padding: `${spacing[12]} 0`,
  borderBottom: `1px solid ${color.border.subtle}`,
  selectors: { '&:last-of-type': { borderBottom: 'none' } },
})

export const text = style({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const title = style([
  typography.body.subSemibold,
  { color: color.text.primary },
])

export const description = style([
  typography.body.caption,
  { color: color.text.secondary },
])

// 줄마다 버튼 폭이 다르면 오른쪽 끝이 들쭉날쭉하다 — 가장 긴 라벨에 맞춘 고정 폭.
const ACTION_WIDTH = '104px'

// 다른 화면으로 가는 링크라 <a>로 두고 버튼 모양만 입힌다.
export const action = style([
  typography.button.smMedium,
  {
    width: ACTION_WIDTH,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '36px',
    padding: `0 ${spacing[12]}`,
    borderRadius: '8px',
    border: '1px solid transparent',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  },
])

// 긴급은 결제가 막힌 일이라 위험색 버튼으로 바로 처리하게 한다.
export const actionPrimary = style({
  background: color.status.danger,
  color: color.text.inverse,
  selectors: { '&:hover': { filter: 'brightness(0.92)' } },
})

export const actionOutline = style({
  background: color.background.base,
  borderColor: color.border.default,
  color: color.text.primary,
  selectors: { '&:hover': { background: color.background.surface } },
})

// 누를 수 있는 것처럼 보이지 않게 버튼 자리에 글자만 둔다.
export const handoff = style([
  typography.body.subMedium,
  {
    width: ACTION_WIDTH,
    flexShrink: 0,
    textAlign: 'center',
    color: color.text.secondary,
    whiteSpace: 'nowrap',
  },
])

// 범위 표시 — 상태가 아니라 설명이라 무채색으로 작게.
export const scope = style([
  typography.body.caption,
  {
    marginLeft: spacing[8],
    padding: `${spacing[2]} ${spacing[6]}`,
    borderRadius: '4px',
    background: color.background.subSurface,
    color: color.text.secondary,
    verticalAlign: 'middle',
  },
])
