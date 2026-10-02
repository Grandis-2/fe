import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

// 좌우 패딩은 OrderSummary의 금액 줄(16px)과 같은 값이라 세로선이 맞는다.
export const terms = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  padding: `${spacing[24]} ${spacing[16]}`,
})

export const termsTitle = typography.title.mdSemibold

export const agreeAll = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[12],
    paddingBottom: spacing[20],
    borderBottom: `1px solid ${color.border.subtle}`,
    color: color.text.primary,
    cursor: 'pointer',
    userSelect: 'none',
  },
])

export const termList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const termRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[12],
})

// 약관보기 버튼은 label 바깥에 둔다 — 안에 있으면 펼치기 클릭이 체크까지 토글한다.
export const termMain = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[12],
  flex: 1,
  minWidth: 0,
  cursor: 'pointer',
})

// 체크박스가 긴 라벨에 눌려 납작해지지 않게 고정 — flex 기본값은 shrink 1이다.
export const checkbox = style({ flexShrink: 0 })

export const termLabel = style([
  typography.body.sub,
  { color: color.text.primary, wordBreak: 'keep-all' },
])

export const detailToggle = style([
  typography.body.caption,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    flexShrink: 0,
    padding: 0,
    border: 'none',
    background: 'none',
    color: color.text.tertiary,
    cursor: 'pointer',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { color: color.text.secondary },
    },
  },
])

export const detailIcon = style({
  width: '14px',
  height: '14px',
  transition: `transform ${motion.duration.fast} ${motion.easing.default}`,
})

export const detailIconOpen = style({ transform: 'rotate(180deg)' })

export const detailPanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  marginTop: spacing[12],
  padding: spacing[16],
  borderRadius: '8px',
  background: color.background.surface,
})

export const detailGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const detailHeading = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const detailBody = style([
  typography.body.caption,
  { color: color.text.secondary, wordBreak: 'keep-all' },
])
