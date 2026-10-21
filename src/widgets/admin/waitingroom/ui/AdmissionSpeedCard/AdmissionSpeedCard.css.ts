import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

import {
  card as panel,
  head as panelHead,
  title as panelTitle,
} from '../panel.css'

export const card = panel
export const head = panelHead
export const title = panelTitle

export const caption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// 지금 값 · 바꿀 값 · 적용을 한 줄에 — 좁으면 줄을 바꾼다.
export const control = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[16],
  paddingTop: spacing[16],
  borderTop: `1px solid ${color.border.subtle}`,
})

export const current = style({
  flex: '1 1 160px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: spacing[2],
})

export const currentValue = style([
  typography.title.lgSemibold,
  {
    fontWeight: fontWeight.bold,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const unit = style([
  typography.body.sub,
  { marginLeft: spacing[2], color: color.text.secondary },
])

// 버튼을 입력 칸(small: 46px · 둥글기 8px)과 같은 높이로 맞춰 한 덩어리로 보이게 한다. 오류
// 문구가 칸 아래에 붙어도 버튼이 따라 내려가지 않게 위로 맞춘다.
export const stepper = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[4],
})

export const stepButton = style([
  typography.button.smMedium,
  {
    minWidth: '48px',
    height: '46px',
    padding: `0 ${spacing[10]}`,
    border: `1px solid ${color.border.default}`,
    borderRadius: '8px',
    background: color.background.surface,
    color: color.text.secondary,
    cursor: 'pointer',
    fontVariantNumeric: 'tabular-nums',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:hover': { background: color.background.subSurface } },
  },
])

export const stepInput = style({ width: '120px' })

const previewBase = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
    padding: `${spacing[10]} ${spacing[14]}`,
    borderRadius: '10px',
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

// 바꾼 값이 어느 구간에 들어가는지 막대와 같은 색으로 칠한다.
export const preview = styleVariants({
  success: [previewBase, { background: color.background.subtleSuccess }],
  warning: [previewBase, { background: color.background.subtleWarning }],
  danger: [previewBase, { background: color.background.subtleDanger }],
  muted: [previewBase, { background: color.background.surface }],
})

export const previewValue = style({ fontWeight: fontWeight.semibold })

const noteBase = style([
  typography.body.subSemibold,
  { padding: `${spacing[2]} ${spacing[10]}`, borderRadius: '999px' },
])

export const previewNote = styleVariants({
  success: [
    noteBase,
    { color: color.status.success, background: color.background.base },
  ],
  warning: [
    noteBase,
    { color: color.text.primary, background: color.background.base },
  ],
  danger: [
    noteBase,
    { color: color.status.danger, background: color.background.base },
  ],
})

export const foot = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

// 자주 쓰지 않는 동작이라 버튼보다 작은 글자 링크로 둔다.
export const linkButton = style([
  typography.body.subSemibold,
  {
    minHeight: '36px',
    padding: 0,
    border: 'none',
    background: 'none',
    color: color.primary.base,
    cursor: 'pointer',
    selectors: { '&:disabled': { cursor: 'not-allowed', opacity: 0.5 } },
  },
])

// 입장을 멈추는 동작 — 적용과 떨어뜨리고, 빨간 테두리로 위험하다는 걸 먼저 보인다.
export const stopButton = style([
  typography.button.smMedium,
  {
    minHeight: '36px',
    padding: `0 ${spacing[16]}`,
    border: `1px solid ${color.status.danger}`,
    borderRadius: '999px',
    background: color.background.base,
    color: color.status.danger,
    cursor: 'pointer',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { background: color.background.subtleDanger },
      '&:disabled': { cursor: 'not-allowed', opacity: 0.5 },
    },
  },
])
