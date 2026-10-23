import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

// 사용자 페이지의 알약 칩(필터·최근 검색어·카테고리) — 고르기 전에도 테두리가 보이고,
// 고르면 옅은 남색 바탕 + 밝은 테두리 + 굵은 글자가 된다. 색은 테마 토큰이라 어두운 화면에선
// 감싸는 쪽에 data-theme="dark"가 있어야 한다.
export const root = style([
  typography.body.subMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: '38px',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    padding: `0 ${spacing[16]}`,
    borderRadius: '19px',
    border: `1.5px solid ${color.border.default}`,
    background: 'transparent',
    color: color.text.secondary,
    cursor: 'pointer',
    transition: [
      `background ${motion.duration.fast} ${motion.easing.default}`,
      `border-color ${motion.duration.fast} ${motion.easing.default}`,
      `color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.background.surface,
        color: color.text.primary,
      },
      '&:active:not(:disabled)': { background: color.background.subSurface },
    },
  },
])

// 관리자 화면은 바탕이 background.surface라 root의 hover가 바탕에 묻힌다 — 한 단계 어둡게 한다.
// 안 고른 칩은 흰 바탕이라 회색 화면 위에서 칩 하나하나가 떠 보인다.
export const solid = style({
  background: color.background.base,
  selectors: {
    '&:hover:not(:disabled)': {
      background: color.background.subSurface,
      borderColor: color.border.hover,
    },
  },
})

// root·solid 다음에 선언해 같은 특이도의 hover 규칙을 이긴다.
export const selected = styleVariants({
  // 선택된 칩은 hover해도 그대로다.
  tint: {
    selectors: {
      '&, &:hover:not(:disabled)': {
        background: `color-mix(in srgb, ${color.primary.subtle} 12%, transparent)`,
        borderColor: color.primary.subtle,
        color: color.text.primary,
        fontWeight: fontWeight.semibold,
      },
    },
  },
  // 꽉 찬 칩은 Button solid처럼 hover하면 한 단계 어두워진다.
  solid: {
    background: color.primary.base,
    borderColor: color.primary.base,
    color: color.text.inverse,
    selectors: {
      '&:hover:not(:disabled)': {
        background: color.primary.focus,
        borderColor: color.primary.focus,
        color: color.text.inverse,
      },
    },
  },
})

export const count = style({
  marginLeft: spacing[6],
  color: color.primary.subtle,
  fontVariantNumeric: 'tabular-nums',
})

// X 버튼이 붙는 칩 — 안쪽 두 버튼이 높이를 다 쓰고 여백을 나눠 갖는다.
export const removable = style({ padding: 0, overflow: 'hidden' })

const innerButton = style({
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
})

export const removableLabel = style([
  innerButton,
  { padding: `0 ${spacing[6]} 0 ${spacing[16]}` },
])

export const remove = style([
  innerButton,
  {
    padding: `0 ${spacing[12]} 0 ${spacing[4]}`,
    color: color.text.tertiary,
    selectors: { '&:hover': { color: color.text.primary } },
  },
])
