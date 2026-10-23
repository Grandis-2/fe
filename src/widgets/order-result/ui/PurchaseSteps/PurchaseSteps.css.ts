import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const steps = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: spacing[8],
  margin: 0,
  padding: '24px 28px',
  listStyle: 'none',
  borderRadius: '20px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const step = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
})

const barBase = { height: '4px', borderRadius: '2px' }

// 진행 중인 단계는 절반만 채워 "아직 끝나지 않음"을 보인다.
export const bar = styleVariants({
  done: { ...barBase, background: color.primary.subtle },
  current: {
    ...barBase,
    background: `linear-gradient(90deg, ${color.status.warning} 50%, ${color.border.default} 50%)`,
  },
  todo: { ...barBase, background: color.border.default },
})

export const stepTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
})

export const stepLabel = styleVariants({
  done: [typography.body.subSemibold, { color: color.text.primary }],
  current: [typography.body.subSemibold, { color: color.text.primary }],
  todo: [typography.body.subSemibold, { color: color.text.disabled }],
})

export const stepSub = style([
  typography.body.caption,
  { color: color.text.tertiary },
])
