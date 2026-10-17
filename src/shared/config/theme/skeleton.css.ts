import { keyframes, style } from '@vanilla-extract/css'

import { onDark } from './mixins'
import { color } from './tokens/color/semantic.css'

// 흐르는 빛 스켈레톤 — 크기·모서리는 쓰는 쪽이 style([skeleton, {...}])로 붙인다.
const shimmer = keyframes({
  '0%': { backgroundPosition: '100% 0' },
  '100%': { backgroundPosition: '-100% 0' },
})

// 가운데만 밝게 지나가는 띠 — 바탕색(base)과 빛(light)만 바탕에 따라 다르다.
const shimmerStyle = (base: string, light: string) =>
  style({
    background: `linear-gradient(90deg, ${base} 0%, ${base} 35%, ${light} 50%, ${base} 65%, ${base} 100%)`,
    backgroundSize: '200% 100%',
    animation: `${shimmer} 1.4s linear infinite`,
    '@media': {
      '(prefers-reduced-motion: reduce)': { animation: 'none' },
    },
  })

/** 어두운 바탕(구매자 화면) — 흰빛을 투명하게 깐다 */
export const skeleton = shimmerStyle(onDark(6), onDark(12))

/**
 * 밝은 바탕(관리자 화면) — 흰 바탕에선 위 흰빛이 안 보여 회색 위로 밝은 빛이 지나가게 한다.
 * 색은 테마 토큰이라 나중에 어두운 화면이 모두 data-theme="dark" 안으로 정리되면 하나로
 * 합칠 수 있다.
 */
export const skeletonOnLight = shimmerStyle(
  color.background.subSurface,
  color.background.surface,
)
