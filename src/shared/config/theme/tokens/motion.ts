export const duration = {
  fast: '150ms',
  normal: '220ms',
  // 튕기는(spring) 움직임은 되돌아오는 구간까지 보여야 해서 길게 준다.
  slow: '500ms',
} as const

export const easing = {
  default: 'ease',
  out: 'cubic-bezier(0.23, 1, 0.32, 1)',
  // 목표를 살짝 넘었다가 돌아온다 — 누름(scale) 피드백용.
  spring: 'cubic-bezier(0.3, 1.8, 0.5, 1)',
} as const
