import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing } from '@/shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  borderRadius: '16px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: spacing[16],
  borderBottom: `1px solid ${color.border.default}`,
})

export const headerMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

export const orderDate = style({ color: color.text.secondary })
export const orderNumber = style({ color: color.text.tertiary })

const badgeBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `5px ${spacing[8]}`,
  borderRadius: '999px',
  fontSize: '10px',
})

export const badge = styleVariants({
  delivered: [
    badgeBase,
    { background: color.background.subtleSuccess, color: color.status.success },
  ],
  shipping: [
    badgeBase,
    { background: color.primary.base, color: color.primary.subtler },
  ],
  preparing: [
    badgeBase,
    { background: color.background.subtleInfo, color: color.status.info },
  ],
  cancelled: [
    badgeBase,
    { background: color.background.subtleDanger, color: color.status.danger },
  ],
})

export const itemRow = style({
  padding: spacing[16],
})

const fadeInUp = keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

// "더 보기"로 펼쳐지는 아이템에만 적용 — 뿅 튀어나오는 대신 살짝 떠오르며 나타난다.
export const itemEnter = style({
  animation: `${fadeInUp} 300ms ${motion.easing.default} backwards`,
})

export const actionRow = style({
  display: 'flex',
  padding: `0 ${spacing[16]} ${spacing[16]}`,
})

const actionBase = style({
  transition: `transform 160ms ${motion.easing.default}`,
  selectors: {
    '&:active': {
      transform: 'scale(0.97)',
    },
  },
})

export const action = style({ flex: '1 0 0' })

export const divider = style({
  margin: `0 ${spacing[16]}`,
  height: '1px',
  background: color.border.default,
})

export const expandRow = style([
  actionBase,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    width: '100%',
    padding: spacing[16],
    color: color.text.tertiary,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
])

export const expandIcon = style({
  width: '18px',
  height: '18px',
  transition: `transform 200ms ${motion.easing.default}`,
})

export const expandIconOpen = style({
  transform: 'rotate(180deg)',
})
