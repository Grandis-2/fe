import { keyframes, style } from '@vanilla-extract/css'

import { onDark } from './mixins'

// 어두운 바탕 위의 흐르는 빛 스켈레톤 — 크기·모서리는 쓰는 쪽이 style([skeleton, {...}])로 붙인다.
const shimmer = keyframes({
  '0%': { backgroundPosition: '100% 0' },
  '100%': { backgroundPosition: '-100% 0' },
})

export const skeleton = style({
  background: `linear-gradient(90deg, ${onDark(6)} 0%, ${onDark(6)} 35%, ${onDark(12)} 50%, ${onDark(6)} 65%, ${onDark(6)} 100%)`,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.4s linear infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})
