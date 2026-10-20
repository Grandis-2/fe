import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

import { panel, panelHeader, panelLink, panelTitle } from '../panel.css'

export const root = panel
export const header = panelHeader
export const title = panelTitle
export const link = panelLink

export const empty = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// ── 전체: 사전예약 타일 ──────────────────────────────────────

export const tiles = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

// 타일은 모두 같은 회색 — 상태는 오른쪽 꼬리표로만 구분한다.
export const tile = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[14],
  padding: `${spacing[14]} ${spacing[16]}`,
  borderRadius: '12px',
  border: '1px solid transparent',
  background: color.background.surface,
  font: 'inherit',
  color: color.text.primary,
  textAlign: 'left',
  cursor: 'pointer',
  transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { background: color.background.subSurface },
    '&:focus-visible': {
      outline: `2px solid ${color.primary.base}`,
      outlineOffset: '2px',
    },
  },
})

export const tileWait = style({
  minWidth: '92px',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const tileWaitValue = style([
  typography.title.lgSemibold,
  { fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 },
])

export const tileText = style({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const tileName = style([
  typography.body.defaultMedium,
  {
    fontWeight: fontWeight.semibold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
])

export const tileMeta = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

// ── 하나를 골랐을 때 ────────────────────────────────────────

const heroBase = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[16],
  padding: `${spacing[14]} ${spacing[16]}`,
  borderRadius: '12px',
})

// 평소엔 회색, 맨 뒤 대기가 10분 넘으면 경고, 입장이 멈추면 위험
export const hero = styleVariants({
  normal: [heroBase, { background: color.background.surface }],
  long: [heroBase, { background: color.background.subtleWarning }],
  stopped: [heroBase, { background: color.background.subtleDanger }],
})

export const heroMain = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const heroLabel = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const heroLabelBad = style([
  typography.body.subSemibold,
  { color: color.status.danger },
])

export const heroValue = style([
  typography.title.lgSemibold,
  { fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 },
])

export const heroText = style([
  typography.title.smMedium,
  { fontWeight: fontWeight.bold, color: color.text.primary },
])

export const heroDivider = style({
  width: '1px',
  alignSelf: 'stretch',
  background: color.border.default,
})

export const stat = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const statLabel = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const statValue = style([
  typography.title.lgSemibold,
  { fontVariantNumeric: 'tabular-nums' },
])

export const statUnit = style([
  typography.body.sub,
  { marginLeft: spacing[2], color: color.text.secondary },
])

// 카드 gap(12px)에 더해 위 대기 상자와 조금 더 띄운다
export const block = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  marginTop: spacing[8],
})

export const blockHead = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: spacing[8],
})

export const blockTitle = style([
  typography.title.mdMedium,
  { color: color.text.primary },
])

export const blockMeta = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const hint = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const hintBad = style([hint, { color: color.status.danger }])

export const hintSub = style({ color: color.text.tertiary })

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
  marginTop: 'auto',
})

export const action = style([
  typography.button.smMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '36px',
    padding: `0 ${spacing[14]}`,
    borderRadius: '999px',
    border: `1px solid ${color.border.default}`,
    background: color.background.base,
    color: color.text.primary,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:hover': { background: color.background.surface } },
  },
])

export const actionDanger = style([
  action,
  {
    borderColor: color.status.danger,
    background: color.status.danger,
    color: color.text.inverse,
    selectors: {
      '&:hover': {
        background: color.status.danger,
        filter: 'brightness(0.92)',
      },
    },
  },
])
