import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: spacing[8],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const step = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

const barBase = {
  height: '4px',
  borderRadius: '2px',
  marginBottom: spacing[6],
}

// 진행 중인 단계는 절반만 채워 "아직 끝나지 않음"을 보인다(구매 확정 마감 막대와 같은 말투).
const half = (fill: string) =>
  `linear-gradient(90deg, ${fill} 50%, ${color.border.default} 50%)`

export const bar = styleVariants({
  done: { ...barBase, background: color.primary.subtle },
  current: { ...barBase, background: half(color.primary.base) },
  warning: { ...barBase, background: half(color.status.danger) },
  todo: { ...barBase, background: color.border.default },
})

const ellipsis = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const

export const label = styleVariants({
  done: [typography.body.subSemibold, ellipsis, { color: color.text.primary }],
  current: [
    typography.body.subSemibold,
    ellipsis,
    { color: color.text.primary },
  ],
  warning: [
    typography.body.subSemibold,
    ellipsis,
    { color: color.status.danger },
  ],
  todo: [typography.body.subSemibold, ellipsis, { color: color.text.disabled }],
})

export const sub = styleVariants({
  done: [typography.body.caption, ellipsis, { color: color.text.secondary }],
  current: [
    typography.body.captionMedium,
    ellipsis,
    { color: color.primary.base },
  ],
  warning: [
    typography.body.captionMedium,
    ellipsis,
    { color: color.status.danger },
  ],
  todo: [typography.body.caption, ellipsis, { color: color.text.secondary }],
})
