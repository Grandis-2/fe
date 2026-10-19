import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const sectionHead = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: spacing[8],
})

export const sectionTitle = style([
  typography.title.mdSemibold,
  { margin: 0, color: color.text.primary },
])

export const caption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const lead = style([
  typography.body.defaultRegular,
  { color: color.text.primary },
])

const cardBase = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: `${spacing[20]} ${spacing[24]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

// 판정이 경고일 때만 테두리를 물들인다 — 바탕까지 칠하면 경고판처럼 보인다.
export const card = styleVariants({
  success: [cardBase],
  muted: [cardBase],
  warning: [cardBase, { borderColor: color.status.warning }],
  danger: [cardBase, { borderColor: color.status.danger }],
})

export const verdict = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[10],
})

const dotBase = style({
  width: '12px',
  height: '12px',
  flexShrink: 0,
  borderRadius: '50%',
})

export const dot = styleVariants({
  success: [dotBase, { background: color.status.success }],
  warning: [dotBase, { background: color.status.warning }],
  danger: [dotBase, { background: color.status.danger }],
  muted: [dotBase, { background: color.text.disabled }],
})

const verdictBase = style([typography.title.smMedium])

export const verdictText = styleVariants({
  success: [verdictBase, { color: color.text.primary }],
  warning: [verdictBase, { color: color.text.primary }],
  danger: [verdictBase, { color: color.status.danger }],
  muted: [verdictBase, { color: color.text.secondary }],
})

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

const chipBase = style([
  typography.body.subMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '32px',
    padding: `0 ${spacing[12]}`,
    borderRadius: '999px',
    fontVariantNumeric: 'tabular-nums',
  },
])

export const chip = style([
  chipBase,
  { background: color.background.subSurface, color: color.text.secondary },
])

export const chipWarn = style([
  chipBase,
  { background: color.background.subSurface, color: color.status.danger },
])

export const chipDanger = style([
  chipBase,
  { background: color.background.subSurface, color: color.status.danger },
])

export const divider = style({
  height: '1px',
  background: color.border.subtle,
})

// 지금 값 · 입력 · 적용을 한 줄에 — 좁으면 줄을 바꾼다.
export const speedRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

export const speedLabel = style({
  flex: '1 1 220px',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const speedValue = style([
  typography.title.mdSemibold,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const speedInput = style({ width: '200px' })

export const speedFoot = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spacing[8]} ${spacing[24]}`,
})

export const previewLine = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const noteText = styleVariants({
  success: { color: color.status.success },
  warning: { color: color.text.primary },
  danger: { color: color.status.danger },
})

export const speedLinks = style({ display: 'flex', gap: spacing[12] })

// 자주 쓰지 않는 동작이라 버튼보다 작은 글자 링크로 둔다.
const linkBase = style([
  typography.body.sub,
  {
    minHeight: '44px',
    padding: `0 ${spacing[4]}`,
    border: 'none',
    background: 'none',
    textDecoration: 'underline',
    cursor: 'pointer',
    selectors: { '&:disabled': { cursor: 'not-allowed', opacity: 0.5 } },
  },
])

export const linkButton = style([linkBase, { color: color.text.secondary }])

// 입장을 멈추는 동작 — 빨간 글자로 위험하다는 걸 먼저 보인다.
export const linkDanger = style([linkBase, { color: color.status.danger }])

export const alertRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
  width: '100%',
})

export const capCell = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[8],
  fontVariantNumeric: 'tabular-nums',
})

export const miniTrack = style({
  position: 'relative',
  width: '96px',
  height: '8px',
  borderRadius: '4px',
  background: color.background.subSurface,
  overflow: 'hidden',
})

const miniFillBase = style({ position: 'absolute', inset: '0 auto 0 0' })

export const miniFill = styleVariants({
  normal: [miniFillBase, { background: color.primary.base }],
  atCap: [miniFillBase, { background: color.status.warning }],
})

export const slowText = style({
  color: color.status.danger,
  fontWeight: 600,
})

export const rowActions = style({
  display: 'inline-flex',
  justifyContent: 'flex-end',
  gap: spacing[8],
})

export const graceWarn = style([
  typography.body.sub,
  { color: color.status.danger },
])
