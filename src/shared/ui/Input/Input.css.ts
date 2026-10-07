import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  width: '100%',
})

const boxBase = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  background: color.background.base,
  border: `1px solid ${color.primary.surface}`,
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:focus-within': {
      borderColor: color.primary.base,
    },
    // 읽기 전용 칸은 편집 가능한 칸과 구분되게 깐다.
    '&:has(input:read-only)': {
      background: color.background.surface,
    },
  },
})

export const box = styleVariants({
  medium: [
    boxBase,
    { height: '56px', borderRadius: '12px', padding: `0 ${spacing[16]}` },
  ],
  small: [
    boxBase,
    { height: '46px', borderRadius: '8px', padding: `0 ${spacing[12]}` },
  ],
})

// stacked — 카드(background.base) 안에 한 단계 어둡게 파인 칸. box 다음, boxError 앞에 선언해야
// 높이·테두리는 덮고 에러 테두리에는 진다. 읽기 전용 바탕은 boxBase의 :has() 규칙이 특이도로 이긴다.
export const stackedBox = style({
  height: '52px',
  borderWidth: '1.5px',
  borderColor: color.border.default,
  background: color.background.page,
  transition: [
    `border-color ${motion.duration.fast} ${motion.easing.default}`,
    `box-shadow ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:focus-within': {
      borderColor: color.primary.subtle,
      boxShadow: `0 0 0 3px color-mix(in srgb, ${color.primary.subtle} 18%, transparent)`,
    },
    '&:has(input:read-only)': { borderColor: color.border.subtle },
  },
})

export const boxError = style({
  borderColor: color.status.danger,
  background: color.background.subtleDanger,
  selectors: {
    '&:focus-within': {
      borderColor: color.status.danger,
    },
  },
})

const fieldBase = {
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: color.primary.focus,
  paddingTop: spacing[16],
}

export const field = styleVariants({
  medium: [typography.body.defaultRegular, fieldBase],
  small: [typography.body.sub, fieldBase],
})

export const stackedField = style({
  paddingTop: 0,
  color: color.text.primary,
  selectors: {
    '&::placeholder': { color: color.text.disabled },
    '&:read-only': { color: color.text.secondary },
  },
})

// 칸의 둥근 모서리(12px)보다 안쪽에서 시작해야 칸 테두리와 같은 선에 붙어 보이지 않는다.
export const stackedLabel = style([
  typography.body.sub,
  { paddingLeft: spacing[4], color: color.text.tertiary },
])

export const fieldError = style({
  color: color.status.danger,
})

const labelBase = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  color: color.text.tertiary,
  pointerEvents: 'none',
  transition: `all ${motion.duration.fast} ${motion.easing.default}`,
} as const

// 칸에 포커스가 가면 라벨도 테두리와 같은 포커스 색으로 바꾼다.
const labelFocus = style({
  selectors: {
    [`${boxBase}:focus-within &`]: {
      color: color.primary.base,
    },
  },
})

export const label = styleVariants({
  medium: [
    typography.body.defaultRegular,
    labelFocus,
    {
      ...labelBase,
      left: spacing[16],
      selectors: {
        [`${field.medium}:focus ~ &, ${field.medium}:not(:placeholder-shown) ~ &`]:
          {
            top: spacing[8],
            transform: 'translateY(0)',
            fontSize: fontSize[12],
          },
      },
    },
  ],
  small: [
    typography.body.sub,
    labelFocus,
    {
      ...labelBase,
      left: spacing[12],
      selectors: {
        [`${field.small}:focus ~ &, ${field.small}:not(:placeholder-shown) ~ &`]:
          {
            top: spacing[8],
            transform: 'translateY(0)',
            fontSize: '9px',
          },
      },
    },
  ],
})

// 에러 칸은 포커스 중에도 테두리처럼 에러 색을 유지한다(labelFocus보다 뒤에 선언돼 이긴다).
export const labelError = style({
  color: color.status.danger,
  selectors: {
    [`${boxBase}:focus-within &`]: {
      color: color.status.danger,
    },
  },
})

export const errorRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[4],
  color: color.status.danger,
})

export const errorIcon = styleVariants({
  medium: { width: '16px', height: '16px', flexShrink: 0 },
  small: { width: '13px', height: '13px', flexShrink: 0 },
})

export const errorText = styleVariants({
  medium: [typography.body.caption],
  small: [typography.body.caption, { fontSize: '10px' }],
})
