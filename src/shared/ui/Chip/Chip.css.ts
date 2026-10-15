import { style } from '@vanilla-extract/css'

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

// root 다음에 선언해 같은 특이도의 hover 규칙을 이긴다 — 선택된 칩은 hover해도 그대로다.
export const selected = style({
  selectors: {
    '&, &:hover:not(:disabled)': {
      background: `color-mix(in srgb, ${color.primary.subtle} 12%, transparent)`,
      borderColor: color.primary.subtle,
      color: color.text.primary,
      fontWeight: fontWeight.semibold,
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
