import { globalStyle, style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 결과 제목 위의 상태 아이콘 — 제목(h2) 안에 있어 블록으로 띄워 가운데 둔다.
const badgeBase = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  margin: `0 auto ${spacing[12]}`,
  borderRadius: '50%',
})

export const badge = styleVariants({
  success: [
    badgeBase,
    { background: color.background.subtleSuccess, color: color.status.success },
  ],
  warning: [
    badgeBase,
    { background: color.background.subtleWarning, color: color.status.warning },
  ],
  danger: [
    badgeBase,
    { background: color.background.subtleDanger, color: color.status.danger },
  ],
})
globalStyle(`${badgeBase} svg`, { width: '24px', height: '24px' })

// 건수 목록 — 사전예약별, 결과(다시 등록·또 실패)
export const box = style({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: `${spacing[4]} ${spacing[14]}`,
  borderRadius: '12px',
  background: color.background.surface,
})

export const boxTitle = style([
  typography.body.sub,
  { padding: `${spacing[10]} 0 ${spacing[4]}`, color: color.text.tertiary },
])

export const boxNote = style([
  typography.body.sub,
  { padding: `${spacing[4]} 0 ${spacing[10]}`, color: color.text.secondary },
])

// 실패 원인 — 읽을 수 있는 뜻 옆에 서버가 준 코드를 작게 붙인다.
export const cause = style({
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: spacing[6],
})

export const causeCode = style([
  typography.body.caption,
  { color: color.text.tertiary, fontFamily: 'monospace' },
])

export const row = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    padding: `${spacing[8]} 0`,
    color: color.text.primary,
    selectors: {
      [`${boxTitle} + &, &:first-child`]: { borderTop: 'none' },
      '& + &': { borderTop: `1px solid ${color.border.subtle}` },
    },
  },
])

export const value = style({
  margin: 0,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
})

export const dangerValue = style([value, { color: color.status.danger }])

export const meta = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
    color: color.text.tertiary,
  },
])

export const metaIcon = style({ width: '14px', height: '14px' })

// 진행 — 큰 숫자, 막대, 남은 시간
export const big = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: spacing[6],
  fontVariantNumeric: 'tabular-nums',
})

export const bigValue = style({
  fontSize: '40px',
  fontWeight: 700,
  lineHeight: 1.2,
  color: color.primary.base,
})

export const bigTotal = style([
  typography.title.mdSemibold,
  { color: color.text.tertiary },
])

export const progress = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const bar = style({
  height: '8px',
  borderRadius: '9999px',
  background: color.background.subSurface,
  overflow: 'hidden',
})

export const barFill = style({
  display: 'block',
  height: '100%',
  borderRadius: '9999px',
  background: color.primary.base,
  transition: 'width 1s linear',
})

export const progressMeta = style([
  typography.body.sub,
  {
    display: 'flex',
    justifyContent: 'space-between',
    gap: spacing[12],
    color: color.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
])

// Modal의 확인/취소 줄과 같은 배치 — 버튼이 상태마다 달라 내용 쪽에서 그린다.
export const actions = style({
  display: 'flex',
  justifyContent: 'center',
  gap: spacing[8],
  marginTop: spacing[8],
})

export const link = style([
  typography.body.subSemibold,
  {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing[4],
    color: color.primary.base,
    textDecoration: 'none',
    selectors: { '&:hover': { color: color.primary.focus } },
  },
])

export const linkIcon = style({ width: '14px', height: '14px' })
