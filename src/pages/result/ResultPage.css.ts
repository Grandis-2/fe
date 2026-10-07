import { style, styleVariants } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  spacing,
  statusOnDark,
  typography,
} from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'
import { headerHeight } from '@widgets/header'
import type { OrderStatusTone } from '@widgets/order-result'

// 어두운 페이지 — 헤더 높이만큼 끌어올려 헤더 뒤까지 빛이 이어지게 한다(data-header-theme="dark").
export const root = style({
  boxSizing: 'border-box',
  minHeight: '100vh',
  marginTop: `calc(-1 * ${headerHeight})`,
  paddingTop: headerHeight,
  color: color.text.primary,
})

const tint = (value: string, percent: number) =>
  `color-mix(in srgb, ${value} ${percent}%, transparent)`

// 위 가운데에서 상태 색 빛이 번진다 — 다른 어두운 페이지(glowBackground)와 달리 결과에 따라 빛 색이 바뀐다.
const glowOf = (main: string, side: string) =>
  [
    `radial-gradient(ellipse 60% 520px at 50% -10%, ${main}, transparent 70%)`,
    `radial-gradient(ellipse 40% 380px at 15% 0%, ${side}, transparent 70%)`,
    color.backgroundDark.base,
  ].join(', ')

export const glow = styleVariants({
  success: {
    background: glowOf(
      tint(color.primary.base, 55),
      tint(color.secondary.subtle, 30),
    ),
  },
  pending: {
    background: glowOf(
      tint(color.status.warning, 22),
      tint(color.primary.base, 30),
    ),
  },
  failure: {
    background: glowOf(
      tint(color.status.danger, 26),
      tint(color.primary.base, 22),
    ),
  },
} satisfies Record<OrderStatusTone, object>)

export const content = style({
  boxSizing: 'border-box',
  maxWidth: '640px',
  margin: '0 auto',
  padding: `72px ${spacing[32]} 120px`,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[32],
  '@media': {
    [breakpoint.mobile]: {
      paddingInline: spacing[20],
      paddingTop: spacing[40],
    },
  },
})

export const hero = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[14],
  textAlign: 'center',
})

const badgeOf = (value: string) => [
  typography.body.captionMedium,
  {
    marginTop: spacing[6],
    padding: '5px 10px',
    borderRadius: '8px',
    background: tint(value, 16),
    color: value,
  },
]

export const badge = styleVariants({
  success: badgeOf(color.primary.subtle),
  pending: badgeOf(color.status.warning),
  failure: badgeOf(statusOnDark.danger),
} satisfies Record<OrderStatusTone, unknown>)

// 모바일은 한 단계 줄인다(PaymentPage 제목과 같은 방식).
export const heading = style([
  typography.title.xxlSemibold,
  {
    margin: 0,
    textWrap: 'pretty',
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[24] },
    },
  },
])

export const description = style([
  typography.body.defaultRegular,
  {
    maxWidth: '460px',
    lineHeight: 1.6,
    color: color.text.tertiary,
    textWrap: 'pretty',
  },
])

export const failure = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  padding: `${spacing[20]} ${spacing[24]}`,
  borderRadius: '16px',
  border: `1px solid ${tint(statusOnDark.danger, 24)}`,
  background: tint(statusOnDark.danger, 8),
})

export const failureTitle = style([
  typography.body.subSemibold,
  { color: statusOnDark.danger },
])

export const failureReason = style([
  typography.body.defaultRegular,
  { color: color.text.primary },
])

export const failureNote = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

// 보조(왼쪽)보다 주요 행동(오른쪽)을 넓게 둔다.
export const actions = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
  gap: spacing[10],
})

export const note = style([
  typography.body.caption,
  {
    lineHeight: 1.6,
    color: color.text.tertiary,
    textAlign: 'center',
    textWrap: 'pretty',
  },
])
