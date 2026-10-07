import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: '1px solid transparent',
  color: color.text.primary,
  cursor: 'pointer',
  textAlign: 'center',
  transition: [
    `background ${motion.duration.fast} ${motion.easing.default}`,
    `border-color ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:hover:not(:disabled)': {
      background: color.primary.subtler,
      color: color.primary.focus,
    },
  },
})

export const size = styleVariants({
  // 옵션 목록에서 한 줄을 통째로 차지하는 라디오 타일(Product Detail.dc.html) — 왼쪽 라디오 점(::before),
  // 라벨, 오른쪽 끝 추가금액(extra). 선택 상태는 아래 selected가 얹는다.
  medium: [
    base,
    typography.body.defaultMedium,
    {
      display: 'flex',
      justifyContent: 'flex-start',
      gap: spacing[12],
      width: '100%',
      height: '58px',
      padding: `0 18px`,
      background: color.background.base,
      border: `1.5px solid ${color.border.default}`,
      borderRadius: '12px',
      color: color.text.secondary,
      textAlign: 'left',
      transition: [
        `background ${motion.duration.fast} ${motion.easing.default}`,
        `border-color ${motion.duration.fast} ${motion.easing.default}`,
        `box-shadow ${motion.duration.fast} ${motion.easing.default}`,
      ].join(', '),
      selectors: {
        '&::before': {
          content: '""',
          flexShrink: 0,
          boxSizing: 'border-box',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: `1.5px solid ${color.text.disabled}`,
        },
        '&:hover:not(:disabled)': {
          background: color.background.surface,
          borderColor: color.border.hover,
          color: color.text.primary,
        },
        '&:active:not(:disabled)': { transform: 'scale(0.99)' },
      },
    },
  ],
  // 상품 카드의 용량 칩(Product Card.dc.html) — 고르기 전엔 테두리 없이 흐린 글자만 보인다.
  small: [
    base,
    typography.body.sub,
    {
      padding: '5px 9px',
      borderRadius: '6px',
      color: color.text.tertiary,
      selectors: {
        '&:hover:not(:disabled)': {
          background: color.background.surface,
          color: color.text.primary,
        },
        '&:active:not(:disabled)': { background: color.background.subSurface },
      },
    },
  ],
})

// base 다음에 선언 — 동일 특이도(selector specificity)에서는 나중에 선언된 규칙이 이겨야
// hover 시에도 selected 쪽 배경/테두리/글자색이 유지된다(= selected일 땐 hover 스타일이 안 먹음).
// background/borderColor/color 세 개를 전부 '&, &:hover:not(:disabled)'에 넣어야
// base의 hover 규칙(동일 특이도)을 모든 속성에서 이길 수 있다 — 하나라도 빠지면 그 속성만
// hover 시 base 쪽 값으로 새어나간다.
export const selected = style({
  selectors: {
    '&, &:hover:not(:disabled)': {
      background: 'transparent',
      borderColor: color.primary.focus,
      color: color.primary.focus,
    },
    // medium은 선택돼도 배경이 흰색이다(위 '&'의 transparent를 덮는다). 테두리는 2px처럼
    // 보이게 한다 — border-width를 바꾸면 안쪽 글자가 밀려서 같은 색 inset 그림자로 1px을 더한다.
    // small은 옅은 남색 바탕 + 밝은 테두리 + 굵은 흰 글자(어두운 카드 위 기준).
    [`${size.small}&, ${size.small}&:hover:not(:disabled)`]: {
      background: `color-mix(in srgb, ${color.primary.subtle} 12%, transparent)`,
      borderColor: color.primary.subtle,
      color: color.text.primary,
      fontWeight: fontWeight.semibold,
    },
    // medium은 옅은 남색 바탕 + 밝은 테두리 + 바깥 링, 라디오 점이 채워진다.
    [`${size.medium}&, ${size.medium}&:hover:not(:disabled)`]: {
      background: `color-mix(in srgb, ${color.primary.subtle} 16%, transparent)`,
      borderColor: color.primary.subtle,
      boxShadow: `0 0 0 3px color-mix(in srgb, ${color.primary.subtle} 18%, transparent)`,
      color: color.text.primary,
      fontWeight: fontWeight.bold,
    },
    [`${size.medium}&::before`]: {
      border: 'none',
      // 가운데 8px 점은 바탕색으로 뚫어 보인다.
      background: `radial-gradient(circle, ${color.background.base} 4px, ${color.primary.subtle} 4.5px)`,
    },
  },
})

// 라벨 옆 추가금액 같은 보조 문구 — 선택돼도 버튼 글자색을 따라 바뀌지 않고 흐린 색을 유지한다.
export const extra = style([
  typography.body.subMedium,
  { marginLeft: 'auto', color: color.text.tertiary, whiteSpace: 'nowrap' },
])
