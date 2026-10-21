import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

import {
  card as panel,
  head as panelHead,
  title as panelTitle,
} from '../panel.css'

export const card = panel
export const head = panelHead
export const title = panelTitle

export const lead = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// 오른쪽 좁은 칸에 들어가 두 줄 두 칸으로 놓는다.
export const choices = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: spacing[6],
})

const choiceBase = style([
  typography.body.subMedium,
  {
    minHeight: '38px',
    padding: `0 ${spacing[8]}`,
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:disabled': { cursor: 'not-allowed', opacity: 0.5 } },
  },
])

export const choice = styleVariants({
  off: [
    choiceBase,
    {
      border: `1px solid ${color.border.default}`,
      background: color.background.base,
      color: color.text.secondary,
      selectors: { '&:hover': { background: color.background.surface } },
    },
  ],
  on: [
    choiceBase,
    {
      border: `1px solid ${color.primary.base}`,
      background: color.primary.subtler,
      color: color.primary.base,
    },
  ],
})

export const note = style([
  typography.body.caption,
  { color: color.text.secondary },
])

// 늘려 둔 상태 — 대기 인원이 부풀어 보인다는 대가를 빨간 글자로 알린다.
export const noteWarn = style([
  typography.body.caption,
  { color: color.status.danger },
])
