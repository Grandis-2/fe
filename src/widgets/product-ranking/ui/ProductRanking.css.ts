import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import {
  bleedScrollRow,
  breakpoint,
  color,
  onDark,
  spacing,
} from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

// 순위 숫자 칸 폭 — 두 자리(10위)는 숫자가 넓어 칸도 넓힌다. 이미지 타일(204px)은 같다.
const RANK_WIDTH = { single: 96, double: 168 }
const TILE_WIDTH = 204
// 숫자 칸이 이미지 밑으로 파고드는 깊이.
const RANK_OVERLAP = 20

// 어두운 구간에 놓이는 위젯이라 테마와 상관없이 밝은 글자(onDark)를 쓴다. 바탕은 놓이는 자리가 정한다.
export const root = style({
  // 줄(row)의 bleedScrollRow가 이 폭을 cqw로 잰다.
  containerType: 'inline-size',
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

export const title = style({
  margin: 0,
  '@media': {
    // 사전예약 제목(PreorderList)과 같은 모바일 크기.
    [breakpoint.mobile]: { fontSize: fontSize[20] },
  },
})

// 1위 숫자 칸은 오른쪽 정렬이라 좁은 "1" 글자 왼쪽이 이만큼 빈다 — 시작 패딩에서 빼서
// 칸이 아니라 "1"의 획이 타이틀 시작선에 맞게 한다. 숫자 폰트·크기가 바뀌면 다시 잰다.
const FIRST_RANK_GAP = '40px'

export const row = style({
  ...bleedScrollRow(FIRST_RANK_GAP),
  // 스크린리더용 숨김 글자(srOnly, absolute)의 기준 — 없으면 가로로 밀린 카드 위치 그대로
  // 문서 밖으로 튀어나가 페이지에 가로 스크롤이 생긴다.
  position: 'relative',
  gap: spacing[12],
  paddingBottom: spacing[4],
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
    background: color.backgroundDark.surface,
  },
])

export const image = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  // ponytail: 상품 PNG에 투명 여백이 좌우 20%씩 있어 키워서 여백을 타일 밖으로 잘라낸다 —
  // 여백 없이 꽉 찬 이미지가 들어오면 가장자리가 잘리니 그때는 scale을 뺀다.
  transform: 'scale(1.5)',
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
