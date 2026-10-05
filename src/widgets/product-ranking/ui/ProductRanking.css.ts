import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing } from '@shared/config/theme'

// 어두운 구간에 놓이는 위젯이라 테마와 상관없이 밝은 글자를 쓴다. 바탕은 놓이는 자리가 정한다.
const onDark = (percent: number) =>
  `color-mix(in srgb, ${color.text.inverse} ${percent}%, transparent)`

// 순위 숫자 칸 폭 — 두 자리(10위)는 숫자가 넓어 칸도 넓힌다. 이미지 타일(204px)은 같다.
const RANK_WIDTH = { single: 96, double: 168 }
const TILE_WIDTH = 204
// 숫자 칸이 이미지 밑으로 파고드는 깊이.
const RANK_OVERLAP = 20

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  color: color.text.inverse,
})

export const header = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: spacing[16],
})

export const title = style({ margin: 0 })

export const arrows = style({
  display: 'flex',
  gap: spacing[8],
})

export const arrow = style({
  display: 'grid',
  placeItems: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  border: `1px solid ${onDark(18)}`,
  background: color.backgroundDark.surface,
  color: 'inherit',
  cursor: 'pointer',
  transition: [
    `opacity ${motion.duration.fast} ${motion.easing.default}`,
    `background ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:hover:not(:disabled)': { background: onDark(10) },
    '&:disabled': { opacity: 0.35, cursor: 'default' },
  },
})

export const row = style({
  // 스크린리더용 숨김 글자(srOnly, absolute)의 기준 — 없으면 가로로 밀린 카드 위치 그대로
  // 문서 밖으로 튀어나가 페이지에 가로 스크롤이 생긴다.
  position: 'relative',
  display: 'flex',
  gap: spacing[12],
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  scrollBehavior: 'smooth',
  scrollbarWidth: 'none',
  paddingBottom: spacing[4],
  '@media': {
    '(prefers-reduced-motion: reduce)': { scrollBehavior: 'auto' },
  },
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  scrollSnapAlign: 'start',
  color: 'inherit',
  textDecoration: 'none',
})

// 다른 규칙의 셀렉터(`${cardSize.single} &`)로도 쓰므로 합성 없이 클래스 하나로 둔다.
export const cardSize = styleVariants(RANK_WIDTH, (rankWidth) => ({
  flex: `0 0 ${TILE_WIDTH + rankWidth}px`,
}))

export const visual = style({
  display: 'flex',
  alignItems: 'flex-end',
  overflow: 'hidden',
})

const rankBase = style({
  position: 'relative',
  left: '-10px',
  bottom: '-10px',
  zIndex: 0,
  flex: '0 0 auto',
  marginRight: `-${RANK_OVERLAP}px`,
  fontSize: '160px',
  fontWeight: 800,
  lineHeight: 0.8,
  letterSpacing: '-0.06em',
  textAlign: 'right',
  // 속은 비우고 외곽선만 그린다 — 어떤 어두운 바탕 위에서도 숫자 테두리만 보인다.
  color: 'transparent',
  selectors: {
    [`${cardSize.single} &`]: { width: `${RANK_WIDTH.single}px` },
    [`${cardSize.double} &`]: { width: `${RANK_WIDTH.double}px` },
  },
})

export const rank = style([
  rankBase,
  {
    WebkitTextStroke: `2px color-mix(in srgb, ${color.primary.subtle} 60%, transparent)`,
  },
])

export const rankSkeleton = style([
  rankBase,
  { WebkitTextStroke: `2px ${onDark(12)}` },
])

const tileBase = style({
  position: 'relative',
  zIndex: 1,
  flex: 1,
  minWidth: 0,
  aspectRatio: '1',
  borderRadius: '14px',
})

export const tile = style([
  tileBase,
  {
    overflow: 'hidden',
    padding: '14px',
    background: color.backgroundDark.surface,
  },
])

export const image = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

export const info = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  // 이름·가격을 숫자 칸 오른쪽(= 이미지 왼쪽 끝 언저리)부터 시작한다.
  selectors: {
    [`${cardSize.single} &`]: {
      paddingLeft: `${RANK_WIDTH.single - RANK_OVERLAP + 2}px`,
    },
    [`${cardSize.double} &`]: {
      paddingLeft: `${RANK_WIDTH.double - RANK_OVERLAP + 2}px`,
    },
  },
})

export const name = style({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
})

const shimmer = keyframes({
  '0%': { backgroundPosition: '100% 0' },
  '100%': { backgroundPosition: '-100% 0' },
})

const skeleton = style({
  background: `linear-gradient(90deg, ${onDark(6)} 0%, ${onDark(6)} 35%, ${onDark(12)} 50%, ${onDark(6)} 65%, ${onDark(6)} 100%)`,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.4s linear infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})

export const tileSkeleton = style([tileBase, skeleton])

export const lineSkeleton = style([
  skeleton,
  { height: '14px', borderRadius: '5px' },
])

export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
})
