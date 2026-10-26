import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  padding: '20px 28px',
  borderRadius: '20px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
  '@media': {
    [breakpoint.mobile]: { padding: '16px 20px' },
  },
})

export const title = style([
  typography.body.subSemibold,
  { color: color.text.primary },
])

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

// 점 · 시각 · 이름 · (처리 주체 · 걸린 시간). 좁으면 이름 아래로 메타가 내려간다.
export const item = style({
  display: 'grid',
  gridTemplateColumns: 'auto auto minmax(0, 1fr) auto',
  alignItems: 'center',
  columnGap: spacing[10],
  '@media': {
    [breakpoint.mobile]: {
      gridTemplateColumns: 'auto auto minmax(0, 1fr)',
    },
  },
})

const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.35 },
})

const dotBase = { width: '8px', height: '8px', borderRadius: '50%' }

export const dot = styleVariants({
  done: { ...dotBase, background: color.primary.subtle },
  current: {
    ...dotBase,
    background: color.status.warning,
    animation: `${pulse} 1.2s ease-in-out infinite`,
    '@media': {
      '(prefers-reduced-motion: reduce)': { animation: 'none' },
    },
  },
})

export const time = style([
  typography.body.caption,
  { color: color.text.tertiary, fontVariantNumeric: 'tabular-nums' },
])

export const label = style([typography.body.sub, { color: color.text.primary }])

export const meta = style([
  typography.body.caption,
  {
    color: color.text.tertiary,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    '@media': {
      [breakpoint.mobile]: {
        gridColumn: '3',
        textAlign: 'left',
      },
    },
  },
])
