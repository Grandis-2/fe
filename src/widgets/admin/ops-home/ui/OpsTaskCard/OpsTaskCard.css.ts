import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

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

// 16px 굵게 — 본문 16px에 굵기만 올린다(같은 크기의 굵은 본문 토큰이 없다). 남은 폭을
// 다 쓰고, 넘치면 줄을 바꾼다.
export const title = style([
  typography.body.defaultMedium,
  {
    flex: '1 1 0',
    minWidth: 0,
    fontWeight: fontWeight.semibold,
    color: color.text.primary,
  },
])

// 줄마다 버튼 폭이 다르면 오른쪽 끝이 들쭉날쭉하다 — 가장 긴 라벨('개발팀 문의')에 맞춘 고정 폭.
const ACTION_WIDTH = '76px'

// 다른 화면으로 가는 링크라 <a>로 두고 버튼 모양만 입힌다.
export const action = style([
  typography.button.smMedium,
  {
    width: ACTION_WIDTH,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40px',
    padding: `0 ${spacing[12]}`,
    borderRadius: '9999px',
    border: '1px solid transparent',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
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

// 누를 수 있는 것처럼 보이지 않게 버튼 자리에 글자만 둔다. 크기는 버튼 글자와 같다.
export const handoff = style([
  typography.button.smMedium,
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
  typography.body.sub,
  {
    marginLeft: spacing[8],
    padding: `${spacing[2]} ${spacing[6]}`,
    borderRadius: '4px',
    background: color.background.subSurface,
    color: color.text.secondary,
    verticalAlign: 'middle',
  },
])
