import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const head = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[8],
    color: color.text.secondary,
  },
])

export const headTitle = style({ color: color.text.primary })

// 표시 글자가 막대 위로 올라가므로 위를 비워 둔다.
export const bar = style({
  position: 'relative',
  display: 'flex',
  height: '14px',
  marginTop: spacing[20],
})

const zoneBase = style({ height: '100%' })

export const zone = styleVariants({
  ok: [
    zoneBase,
    {
      borderRadius: '999px 0 0 999px',
      background: color.background.subtleSuccess,
      boxShadow: `inset 0 0 0 1px ${color.status.success}`,
    },
  ],
  warn: [
    zoneBase,
    {
      background: color.background.subtleWarning,
      boxShadow: `inset 0 0 0 1px ${color.status.warning}`,
    },
  ],
  // 위험선이 막대 밖이면 확인 구간이 끝까지 간다.
  warnEnd: [
    zoneBase,
    {
      flex: 1,
      borderRadius: '0 999px 999px 0',
      background: color.background.subtleWarning,
      boxShadow: `inset 0 0 0 1px ${color.status.warning}`,
    },
  ],
  // 받지 않는 구간 — 빗금으로 막힌 곳임을 색과 따로 보인다.
  no: [
    zoneBase,
    {
      flex: 1,
      borderRadius: '0 999px 999px 0',
      background: `repeating-linear-gradient(135deg, ${color.background.subtleDanger} 0 6px, ${color.background.base} 6px 12px)`,
      boxShadow: `inset 0 0 0 1px ${color.status.danger}`,
    },
  ],
})

const markerBase = style({
  position: 'absolute',
  top: '-6px',
  height: '26px',
  borderLeft: '2px solid',
})

export const marker = styleVariants({
  set: [markerBase, { borderColor: color.primary.base }],
  draft: [
    markerBase,
    { borderLeftStyle: 'dashed', borderColor: color.text.primary },
  ],
  applied: [markerBase, { borderColor: color.status.warning }],
})

const markerLabelBase = style([
  typography.body.caption,
  {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const markerLabel = styleVariants({
  set: [markerLabelBase, { color: color.primary.base }],
  draft: [markerLabelBase, { color: color.text.primary }],
  applied: [markerLabelBase, { color: color.text.primary }],
})

export const ticks = style({
  position: 'relative',
  height: '18px',
})

export const tick = style([
  typography.body.caption,
  {
    position: 'absolute',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    color: color.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
])
