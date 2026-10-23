import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

const base = style([
  typography.body.defaultRegular,
  {
    width: '100%',
    border: `1px solid ${color.border.default}`,
    background: color.background.base,
    color: color.text.primary,
    // 세로로만 늘린다 — 가로로 늘어나면 폼 레이아웃이 깨진다.
    resize: 'vertical',
    boxSizing: 'border-box',
    transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&::placeholder': { color: color.text.tertiary },
      '&:focus-visible': {
        outline: 'none',
        borderColor: color.border.focus,
      },
      '&:disabled': {
        background: color.background.disabled,
        color: color.text.tertiary,
      },
    },
  },
])

// 높이는 size가 아니라 rows로 정한다 — 같은 크기에서도 필요한 줄 수가 다르다.
export const size = styleVariants({
  medium: [base, { padding: spacing[16], borderRadius: '12px' }],
  small: [base, { padding: spacing[12], borderRadius: '8px' }],
})

// 글자 수를 칸 안에 띄우려고 감싼다.
export const root = style({ position: 'relative', width: '100%' })

// 마지막 줄 글자가 글자 수 밑으로 들어가지 않게 아래를 비워 둔다.
export const counted = style({ paddingBottom: spacing[40] })

// 오른쪽 끝은 크기 조절 손잡이 자리라 안쪽 여백만큼 띄운다. 글자를 쓰다 눌러도 칸을 누른 것처럼
// 포커스가 그대로 가게 클릭은 통과시킨다.
export const count = style([
  typography.body.caption,
  {
    position: 'absolute',
    right: spacing[16],
    bottom: spacing[12],
    color: color.text.tertiary,
    fontVariantNumeric: 'tabular-nums',
    pointerEvents: 'none',
  },
])
