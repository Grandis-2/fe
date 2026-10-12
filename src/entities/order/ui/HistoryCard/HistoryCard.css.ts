import { keyframes, style } from '@vanilla-extract/css'

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

const divider = `1px solid ${color.border.subtle}`
const warningTint = (percent: number) =>
  `color-mix(in srgb, ${color.status.warning} ${percent}%, transparent)`
const padX = {
  paddingInline: spacing[24],
  '@media': { [breakpoint.mobile]: { paddingInline: spacing[20] } },
}

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '20px',
  border: divider,
  background: color.background.base,
})

// 구매 확정을 기다리는 주문은 테두리부터 경고색이라 목록에서 먼저 눈에 걸린다.
export const rootWarning = style({ borderColor: warningTint(28) })

export const header = style([
  padX,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${spacing[8]} ${spacing[12]}`,
    paddingBlock: '18px',
    borderBottom: divider,
  },
])

export const orderDate = style([
  typography.body.defaultMedium,
  { fontWeight: fontWeight.bold },
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
    background: warningTint(6),
    borderBottom: `1px solid ${warningTint(18)}`,
  },
])

export const noticeTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const noticeTitle = style([
  typography.body.subSemibold,
  { color: color.status.warning },
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
})

export const items = style([padX, { paddingBlock: spacing[4] }])

export const item = style({
  paddingBlock: spacing[16],
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
    border: 'none',
    borderTop: divider,
    background: 'transparent',
    color: color.text.tertiary,
    cursor: 'pointer',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:hover': { color: color.text.primary } },
    '@media': { [breakpoint.mobile]: { marginInline: spacing[20] } },
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
  },
])
