import {
  createVar,
  keyframes,
  style,
  styleVariants,
} from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  spacing,
  typography,
} from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

// 카드 안 구분선 색. 기본은 옅은 회색이고 럭키드로우 당첨(won)만 테두리와 같은 색으로 바꾼다.
const dividerColor = createVar()
const divider = `1px solid ${dividerColor}`
// 강조 카드의 테두리·알림 띠 색. 기본은 경고색이고 highlight 종류마다 바꾼다.
const accent = createVar()
const accentTint = (percent: number) =>
  `color-mix(in srgb, ${accent} ${percent}%, transparent)`
// 모바일은 ProductCard처럼 모서리·여백·글자를 한 단계씩 줄인다 — 데스크톱 값은 그대로 두고 mobile 블록에서만 덮어쓴다.
const padX = {
  paddingInline: spacing[24],
  '@media': { [breakpoint.mobile]: { paddingInline: spacing[16] } },
}

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '20px',
  border: divider,
  background: color.background.base,
  vars: { [accent]: color.status.warning, [dividerColor]: color.border.subtle },
  '@media': { [breakpoint.mobile]: { borderRadius: '14px' } },
})

// 사용자가 할 일이 남은 카드는 테두리부터 강조색이라 목록에서 먼저 눈에 걸린다.
// warning: 결제 대기, payment: 사전예약 구매 확정, won: 럭키드로우 당첨.
// 경고색은 진해서 옅게 섞고, gold·primary.subtle은 지정 색 그대로 테두리에 쓴다.
export const highlight = styleVariants({
  warning: { borderColor: accentTint(28) },
  payment: { vars: { [accent]: color.accent.gold }, borderColor: accent },
  // 선택된 Chip 테두리와 같은 색 — 카드 안 구분선도 같은 색이다.
  won: {
    vars: {
      [accent]: color.primary.subtle,
      [dividerColor]: color.primary.subtle,
    },
    borderColor: accent,
  },
})

export const header = style([
  padX,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${spacing[8]} ${spacing[12]}`,
    paddingBlock: '18px',
    borderBottom: divider,
    '@media': { [breakpoint.mobile]: { paddingBlock: spacing[14] } },
  },
])

export const orderDate = style([
  typography.body.defaultMedium,
  {
    fontWeight: fontWeight.bold,
    '@media': {
      [breakpoint.mobile]: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
      },
    },
  },
])

// Tag small(10px)은 표 안 기준이라 카드 머리에선 작다 — 날짜 옆에서 읽히도록 12px로 키운다.
export const tag = style({
  fontSize: fontSize[12],
  fontWeight: fontWeight.bold,
  padding: `${spacing[3]} ${spacing[8]}`,
})

export const orderNumber = style([
  typography.body.sub,
  { marginLeft: 'auto', color: color.text.tertiary, whiteSpace: 'nowrap' },
])

export const notice = style([
  padX,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${spacing[8]} ${spacing[16]}`,
    paddingBlock: spacing[16],
    background: accentTint(6),
    '@media': { [breakpoint.mobile]: { paddingBlock: spacing[12] } },
    borderBottom: `1px solid ${accentTint(18)}`,
  },
])

export const noticeTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const noticeTitle = style([
  typography.body.subSemibold,
  { color: accent },
])

export const noticeDescription = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

// 초가 바뀔 때 숫자 폭이 흔들리지 않게 고정폭 숫자를 쓴다.
export const countdown = style({
  fontSize: fontSize[24],
  fontWeight: fontWeight.bold,
  letterSpacing: '0.02em',
  fontVariantNumeric: 'tabular-nums',
  color: color.text.primary,
  '@media': { [breakpoint.mobile]: { fontSize: fontSize[20] } },
})

export const items = style([padX, { paddingBlock: spacing[4] }])

export const item = style({
  paddingBlock: spacing[16],
  '@media': { [breakpoint.mobile]: { paddingBlock: spacing[12] } },
  selectors: { '& + &': { borderTop: divider } },
})

const fadeInUp = keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

// "더보기"로 펼쳐지는 아이템에만 적용 — 뿅 튀어나오는 대신 살짝 떠오르며 나타난다.
export const itemEnter = style({
  animation: `${fadeInUp} 300ms ${motion.easing.default} backwards`,
})

export const expandRow = style([
  typography.body.subSemibold,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
    height: '46px',
    marginInline: spacing[24],
    '@media': {
      [breakpoint.mobile]: { height: '40px', marginInline: spacing[16] },
    },
    border: 'none',
    borderTop: divider,
    background: 'transparent',
    color: color.text.tertiary,
    cursor: 'pointer',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:hover': { color: color.text.primary } },
  },
])

export const expandIcon = style({
  width: '18px',
  height: '18px',
  transition: `transform 200ms ${motion.easing.default}`,
})

export const expandIconOpen = style({ transform: 'rotate(180deg)' })

// 카드보다 한 단계 어두운 바닥 — 금액·버튼이 상품 목록과 갈려 보인다.
export const footer = style([
  padX,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[14],
    paddingBlock: '18px',
    borderTop: divider,
    background: color.background.page,
    '@media': {
      [breakpoint.mobile]: { gap: spacing[12], paddingBlock: spacing[14] },
    },
  },
])

// 불러오는 동안의 카드 자리 — 마이페이지 목록과 같은 간격으로 쌓는다.
export const skeletonList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  '@media': { [breakpoint.mobile]: { gap: spacing[16] } },
})
