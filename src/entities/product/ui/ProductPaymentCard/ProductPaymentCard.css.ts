import { style } from '@vanilla-extract/css'

import {
  color,
  motion,
  spacing,
  typography,
  breakpoint,
} from '@/shared/config/theme'
import {
  fontSize,
  lineHeight,
} from '@/shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
})

export const main = style({
  display: 'flex',
  // 썸네일·본문·삭제 버튼의 윗줄을 맞춘다 — 가운데 정렬이면 본문이 길어질 때 썸네일 위로
  // 빈 공간이 생겨서 top: 0에 붙인 삭제 버튼만 혼자 떠 보인다.
  alignItems: 'flex-start',
  gap: spacing[20],
  width: '100%',
})

// 결제/대기 액션은 이 카드 전체에 대한 행동이라 금액과 같은 줄에 두지 않고
// 구분선 아래로 내린다 — 금액을 다 읽은 다음 누르는 순서가 된다.
export const actionRow = style({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: spacing[16],
  paddingTop: spacing[16],
  borderTop: `1px solid ${color.border.subtle}`,
})

// 체크박스만은 카드 높이 기준 가운데에 둔다.
export const checkbox = style({ alignSelf: 'center' })

// 상품명과 삭제 버튼이 한 줄에 온다.
export const titleRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: spacing[8],
})

// 아이콘에 color prop을 주지 않아야 부모의 color 전환을 따라온다.
// hover/press 반응은 QuantityStepper의 step 버튼과 같은 규칙을 쓴다 — 같은 카드 안의
// 아이콘 버튼끼리 반응이 다르면 따로 노는 느낌이 난다.
export const remove = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,

  // 패딩은 터치 영역으로 남기고 레이아웃에는 아이콘 크기만 차지하게 한다 —
  // 오른쪽은 아래 가격과 끝이 맞고, 위아래는 제목 줄 높이를 키우지 않는다.
  margin: `-${spacing[4]}`,
  padding: spacing[4],
  border: 'none',
  borderRadius: '3px',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: [
    `background-color ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
    `transform 160ms ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:active': { transform: 'scale(0.94)' },
  },
  // 터치 기기에서 탭이 hover로 잡혀 색이 남는 걸 막는다.
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover': {
          background: color.background.surface,
          color: color.primary.base,
        },
      },
    },
  },
})

export const thumbnail = style({
  width: '88px',
  height: '88px',
  '@media': {
    [breakpoint.desktop]: { width: '120px', height: '120px' },
  },
  borderRadius: '8px',
  background: color.background.surface,
  flexShrink: 0,
  objectFit: 'cover',
})

export const body_ = style({
  // 썸네일 높이만큼 늘어난 뒤 상품 정보와 수량/가격을 위아래 끝으로 밀어낸다.
  // gap은 남는 공간이 없을 때(모바일에서 본문이 썸네일보다 길 때) 최소 간격으로만 쓰인다.
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: spacing[12],
  flex: '1 0 0',
  minWidth: 0,
  padding: `${spacing[4]} 0`,
})

// cart는 아래에 수량 조절기가 들어가 높이가 이미 충분해서 아래 여백을 뺀다.
export const bodyCart = style({ paddingBottom: 0 })

export const infoGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

// 타이포 프리셋은 여기서 합쳐 둔다 — tsx에서 매번 클래스를 이어 붙이지 않도록.
// 16px + semibold 조합인 타이포 토큰이 없어서 크기만 덮어쓴다.
export const name = style([
  typography.title.mdSemibold,
  {
    fontSize: fontSize[16],
    // 바로 아래 모델명과 붙여 보이도록 행간을 한 단계 좁힌다.
    lineHeight: lineHeight[130],
    color: color.text.primary,
  },
])
// 상품명이 링크일 때. 밑줄 대신 색으로만 반응한다 — 밑줄은 글자 아래 여백을 먹어
// 바로 밑 모델명과 간격이 흔들려 보인다.
export const nameLink = style([
  name,
  {
    textDecoration: 'none',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { color: color.primary.base },
    },
  },
])

export const modelNumber = style([
  typography.body.caption,
  { marginTop: spacing[2], color: color.text.tertiary },
])
export const optionSummary = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const quantityPriceRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
  color: color.text.primary,
})

export const quantityLabel = style([
  typography.body.subMedium,
  {
    color: color.text.tertiary,
    whiteSpace: 'nowrap',
  },
])

// 좁은 폭에선 수량 라벨 아래로 통째로 내려가 우측 정렬을 유지한다.
export const priceActionGroup = style({
  display: 'flex',
  flex: '1 0 auto',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: spacing[16],
})

export const price = style([
  typography.title.lgSemibold,
  { whiteSpace: 'nowrap' },
])
