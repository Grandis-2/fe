import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[16],
  padding: `${spacing[16]} ${spacing[20]}`,
  borderRadius: '12px',
  border: '1px solid',
  background: color.background.base,
})

// 테두리만 급한 정도를 따른다 — 바탕까지 칠하면 카드 여러 장이 경고판처럼 보인다.
export const tone = styleVariants({
  urgent: { borderColor: color.status.danger },
  check: { borderColor: color.status.warning },
  todo: { borderColor: color.border.default },
})

export const text = style({
  flex: '1 1 320px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const title = style([
  typography.title.smMedium,
  { color: color.text.primary },
])

export const description = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// 다른 화면으로 가는 링크는 <a>, 이 화면에서 펼치는 것은 <button>이고 모양은 같다.
export const action = style([
  typography.button.smMedium,
  {
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40px',
    padding: `0 ${spacing[16]}`,
    borderRadius: '8px',
    border: '1px solid transparent',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  },
])

export const actionPrimary = style({
  background: color.primary.base,
  color: color.text.inverse,
  selectors: { '&:hover': { background: color.primary.focus } },
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
    padding: `0 ${spacing[16]}`,
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
