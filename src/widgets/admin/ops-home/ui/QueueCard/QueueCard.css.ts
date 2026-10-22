import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

import { panel, panelHeader, panelTitle } from '../panel.css'

import type { QueueTrend } from '../../lib/queueTrend'

type Status = QueueTrend['status']

export const root = panel
export const header = panelHeader
export const title = panelTitle

export const caption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// ── 판정 상자: 큰 숫자 + 추세 문장 | 설명 | (늘 때) 버튼 ─────────

// 늘면 경고 바탕, 줄면 초록 바탕, 그 밖엔 무채색
const tint: Record<Status, string> = {
  rising: color.background.subtleWarning,
  falling: color.background.subtleSuccess,
  steady: color.background.subSurface,
  measuring: color.background.surface,
}

const accent: Record<Status, string> = {
  rising: color.status.warning,
  falling: color.status.success,
  steady: color.text.secondary,
  measuring: color.text.secondary,
}

export const verdict = styleVariants(tint, (background) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${spacing[12]} ${spacing[20]}`,
  padding: `${spacing[14]} ${spacing[16]}`,
  borderRadius: '10px',
  background,
  transition: `background ${motion.duration.normal} ${motion.easing.default}`,
}))

export const verdictMain = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const big = style([
  typography.title.xxlSemibold,
  {
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.1,
  },
])

export const bigUnit = style([
  typography.body.defaultMedium,
  { marginLeft: spacing[4], color: color.text.secondary },
])

export const trend = style([
  typography.body.defaultMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[6],
    fontWeight: fontWeight.semibold,
    color: color.text.primary,
  },
])

export const trendIcon = styleVariants(accent, (stroke) => ({
  width: '18px',
  height: '18px',
  color: stroke,
  flexShrink: 0,
}))

export const verdictSide = style({
  flex: '1 1 200px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const hint = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const braking = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const action = style([
  typography.button.smMedium,
  {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '40px',
    padding: `0 ${spacing[16]}`,
    borderRadius: '9999px',
    border: `1px solid ${color.border.default}`,
    background: color.background.base,
    color: color.text.primary,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:hover': { background: color.background.surface } },
  },
])

// ── 예약 흐름 줄 ─────────────────────────────────────────────

export const flow = style({
  display: 'flex',
  alignItems: 'stretch',
  margin: 0,
  padding: `${spacing[12]} 0 0`,
  listStyle: 'none',
  borderTop: `1px solid ${color.border.subtle}`,
})

export const flowItem = style({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: spacing[4],
})

export const flowArrow = style({
  width: '16px',
  height: '16px',
  flexShrink: 0,
  color: color.text.disabled,
})

export const flowStep = style({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  padding: `${spacing[6]} ${spacing[10]}`,
  borderRadius: '8px',
})

// 지금 병목인 외부 등록 대기 칸만 판정 색으로 칠한다.
export const flowCurrent = styleVariants(tint, (background) => [
  flowStep,
  { background },
])

export const flowLabel = style([
  typography.body.caption,
  {
    color: color.text.secondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
])

export const flowValue = style([
  typography.body.defaultMedium,
  {
    fontWeight: fontWeight.semibold,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])
