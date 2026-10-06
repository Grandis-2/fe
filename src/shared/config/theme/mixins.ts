import { color } from './tokens/color/semantic.css'

export const lineClamp = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }) as const

// 어두운 바탕 위의 흰 글자·선을 투명도로 낮춘 색 — 예: onDark(18)은 흰색 18%.
export const onDark = (percent: number) =>
  `color-mix(in srgb, ${color.text.inverse} ${percent}%, transparent)`

// 어두운 바탕 위 상태색 — status.*는 밝은 바탕 기준이라 흰색을 섞어 밝힌다.
export const statusOnDark = {
  success: `color-mix(in srgb, ${color.status.success} 70%, white)`,
  danger: `color-mix(in srgb, ${color.status.danger} 55%, white)`,
}

// 어두운 바탕 위 강조 버튼 — 남색에서 보라로 번지는 바탕과 남색 빛 그림자.
export const primaryGradient = `linear-gradient(135deg, ${color.primary.base}, color-mix(in srgb, ${color.primary.base} 65%, ${color.secondary.subtle}))`
export const primaryGlow = `0 8px 28px color-mix(in srgb, ${color.primary.base} 55%, transparent), inset 0 1px 0 ${onDark(18)}`

// 어두운 페이지 바탕 — 남색(왼쪽 위)·보라(오른쪽 위) 빛이 위에서 번진다. 모바일은 빛을 넓고 낮게.
const glow = (indigo: string, violet: string) =>
  [
    `radial-gradient(${indigo}, color-mix(in srgb, ${color.primary.base} 55%, transparent), transparent 70%)`,
    `radial-gradient(${violet}, color-mix(in srgb, ${color.secondary.subtle} 30%, transparent), transparent 70%)`,
    color.backgroundDark.base,
  ].join(', ')

export const glowBackground = {
  desktop: glow('ellipse 55% 420px at 12% 0%', 'ellipse 45% 360px at 88% 0%'),
  mobile: glow('ellipse 90% 300px at 10% 0%', 'ellipse 70% 260px at 100% 0%'),
}
