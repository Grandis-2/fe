import { style, styleVariants } from '@vanilla-extract/css'

import { skeleton, skeletonOnLight } from '@shared/config/theme'

export const root = style({ display: 'block', maxWidth: '100%' })

/**
 * theme: 테마 토큰을 따른다 — 밝은 화면은 회색, data-theme="dark" 안은 어두운 회색.
 * dark: 테마 밖인데 바탕만 어둡게 칠한 화면(사전예약·럭키드로우 목록 등) — 흰빛을 투명하게 깐다.
 */
export const tone = styleVariants({
  theme: [skeletonOnLight],
  dark: [skeleton],
})
