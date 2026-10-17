import { color } from '@shared/config/theme'

// 고른 팀원의 궤도·행성 빛 — 브랜드색(primary.subtle)을 percent만큼 남긴다.
export const activeStroke = (percent: number) =>
  `color-mix(in srgb, ${color.primary.subtle} ${percent}%, transparent)`
