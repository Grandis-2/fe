import { style } from '@vanilla-extract/css'

import { color, motion, typography } from '@/shared/config/theme'

export const root = style({
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  width: '91px',
  height: '30px',
  border: `1px solid ${color.border.default}`,
  borderRadius: '6px',
  background: color.background.base,
})

export const step = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '20px',
  height: '20px',
  margin: '0 4px',
  padding: 0,
  border: 'none',
  borderRadius: '3px',
  background: 'transparent',
  color: color.text.secondary,
  cursor: 'pointer',
  transition: [
    `background-color ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
    `transform 160ms ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:disabled': {
      color: color.text.disabled,
      cursor: 'not-allowed',
    },
    '&:active:not(:disabled)': {
      transform: 'scale(0.94)',
    },
  },
  // 터치 기기에서 탭이 hover로 잡혀 색이 남는 걸 막는다.
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover:not(:disabled)': {
          background: color.background.surface,
          color: color.primary.base,
        },
      },
    },
  },
})

export const divider = style({
  flexShrink: 0,
  width: '1px',
  height: '16px',
  background: color.border.subtle,
})

export const value = style([
  typography.body.defaultMedium,
  {
    paddingTop: '3px',
    flex: 1,
    textAlign: 'center',
    color: color.text.primary,
    // body 자간(-0.04em)은 마지막 글자 뒤에도 붙는데, 가운데 정렬이 그 꼬리 공간까지
    // 포함해 계산해서 자릿수가 늘수록 숫자가 오른쪽으로 밀린다. 숫자만 쓰는 칸이라 끈다.
    letterSpacing: 'normal',
  },
])
