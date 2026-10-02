import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'

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
  // 옵션 목록에서 한 줄을 통째로 차지하는 타일 — 폭은 부모를 채우고, 높이는 글자 한 줄 +
  // 위아래 16px + 테두리 ≈ 54px다. 선택 상태의 굵은 테두리는 아래 selected가 얹는다.
  medium: [
    base,
    typography.body.defaultMedium,
    {
      display: 'flex',
      // 라벨은 왼쪽, 추가금액(extra)은 오른쪽 끝.
      justifyContent: 'space-between',
      gap: spacing[8],
      width: '100%',
      padding: `${spacing[16]} ${spacing[22]}`,
      background: color.background.base,
      borderColor: color.border.default,
      borderRadius: '12px',
    },
  ],
  small: [
    base,
    typography.body.sub,
    { padding: `${spacing[4]} ${spacing[6]}`, borderRadius: '4px' },
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
    [`${size.medium}&, ${size.medium}&:hover:not(:disabled)`]: {
      background: color.background.base,
      boxShadow: `inset 0 0 0 1px ${color.primary.focus}`,
    },
  },
})

// 라벨 옆 추가금액 같은 보조 문구 — 선택돼도 버튼 글자색을 따라 바뀌지 않고 흐린 색을 유지한다.
export const extra = style([
  typography.body.sub,
  { color: color.text.tertiary, whiteSpace: 'nowrap' },
])
