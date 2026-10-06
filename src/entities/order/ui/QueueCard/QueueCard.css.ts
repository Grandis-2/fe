import { style } from '@vanilla-extract/css'

import {
  color,
  motion,
  onDark,
  spacing,
  statusOnDark,
  typography,
} from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

// 대기열 모달 안에 뜨는 카드라 테마와 상관없이 어두운 바탕·흰 글자다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[20],
  boxSizing: 'border-box',
  borderRadius: '16px',
  border: `1px solid ${onDark(10)}`,
  // 같은 어두운 바탕(대기열 모달) 위에 놓여도 한 단 떠 보이도록 흰색을 살짝 덮는다.
  background: `linear-gradient(${onDark(4)}, ${onDark(4)}), ${color.backgroundDark.surface}`,
  color: onDark(92),
})

export const orderGroup = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[8],
})

export const label = style([typography.body.caption, { color: onDark(64) }])

export const strong = style({
  color: onDark(92),
  fontWeight: fontWeight.semibold,
})

export const orderRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing[4],
})

export const orderNumber = style([
  typography.title.xxlSemibold,
  {
    fontSize: '44px',
    fontWeight: fontWeight.bold,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    color: color.text.inverse,
  },
])

export const orderUnit = style([
  typography.body.defaultMedium,
  { fontWeight: fontWeight.semibold, color: onDark(78) },
])

export const progressTrack = style({
  position: 'relative',
  height: '6px',
  marginTop: spacing[20],
  borderRadius: '3px',
  background: onDark(10),
  overflow: 'hidden',
})

export const progressFill = style({
  position: 'absolute',
  inset: '0 auto 0 0',
  borderRadius: '3px',
  background: color.primary.base,
  transition: `width 1s ${motion.easing.out}`,
})

export const totalRow = style([
  typography.body.caption,
  {
    marginTop: spacing[10],
    textAlign: 'right',
    color: onDark(55),
    fontVariantNumeric: 'tabular-nums',
  },
])

export const notice = style([
  typography.body.caption,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    marginTop: spacing[16],
    padding: `${spacing[10]} ${spacing[12]}`,
    borderRadius: '10px',
    background: onDark(6),
    color: onDark(64),
  },
])

export const noticeIcon = style({ flex: 'none' })

const actionButton = style([
  typography.body.subSemibold,
  {
    height: '44px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: [
      `color ${motion.duration.fast} ${motion.easing.default}`,
      `background ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
  },
])

export const leaveButton = style([
  actionButton,
  {
    fontWeight: fontWeight.medium,
    marginTop: spacing[10],
    border: 'none',
    background: 'transparent',
    color: onDark(64),
    selectors: {
      '&:hover': {
        color: statusOnDark.danger,
        background: `color-mix(in srgb, ${statusOnDark.danger} 6%, transparent)`,
      },
    },
  },
])

export const confirm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  marginTop: spacing[10],
  paddingTop: spacing[8],
})

export const confirmText = style([
  typography.body.caption,
  { color: onDark(78), textAlign: 'center' },
])

export const confirmActions = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing[8],
})

export const stayButton = style([
  actionButton,
  {
    border: `1px solid ${onDark(12)}`,
    background: onDark(3),
    color: onDark(92),
    selectors: { '&:hover': { background: onDark(8) } },
  },
])

export const leaveConfirmButton = style([
  actionButton,
  {
    border: `1px solid color-mix(in srgb, ${statusOnDark.danger} 40%, transparent)`,
    background: `color-mix(in srgb, ${statusOnDark.danger} 10%, transparent)`,
    color: statusOnDark.danger,
    selectors: {
      '&:hover': {
        background: `color-mix(in srgb, ${statusOnDark.danger} 18%, transparent)`,
      },
    },
  },
])
