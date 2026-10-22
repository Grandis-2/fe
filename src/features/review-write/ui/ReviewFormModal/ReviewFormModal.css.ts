import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

// 폭·여백·제목은 shared/ui/Modal이 갖고 있다.
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

// 안내 문구 아래에 별 다섯 개 — 제목·상품명처럼 가운데 정렬.
export const rating = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[8],
})

// 별 글자 자체에 옆 여백이 있어 칸 사이는 띄우지 않는다.
export const stars = style({ display: 'flex' })

const starBase = style({
  width: '44px',
  height: '44px',
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontSize: '40px',
  lineHeight: 1,
  cursor: 'pointer',
  transition: [
    `color ${motion.duration.fast} ${motion.easing.default}`,
    `transform 160ms ${motion.easing.default}`,
  ].join(', '),
  selectors: { '&:active': { transform: 'scale(0.9)' } },
})

export const star = styleVariants({
  filled: [starBase, { color: color.status.warning }],
  empty: [starBase, { color: color.border.default }],
})

// 모달 설명 자리의 상품명 — 공용 설명 글자(14px)보다 키워 어느 상품의 리뷰인지 먼저 읽히게 한다.
export const target = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

// 위의 상품명보다 튀지 않게 한 단계 작고 흐리게 둔다.
export const prompt = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const textField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

// 카드보다 한 단계 어둡게 파인 칸(결제 페이지 입력 칸과 같은 바탕). 높이는 고정한다.
export const textarea = style({
  background: color.background.page,
  resize: 'none',
})

export const counter = style([
  typography.body.caption,
  { alignSelf: 'flex-end', color: color.text.tertiary },
])
