import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

import {
  card as panel,
  head as panelHead,
  title as panelTitle,
} from '../panel.css'

export const card = panel
export const head = panelHead
export const title = panelTitle

export const lead = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

// 오른쪽 좁은 칸에 들어가 두 줄 두 칸으로 놓는다.
export const choices = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: spacing[6],
})

// 칸을 꽉 채우고, 고른 값은 남색으로 채운다(상품별 입장 상한의 단계 칩과 같다).
export const choice = style({
  justifyContent: 'center',
  selectors: {
    // 줄이 있어 막힌 칸 — 누를 수 없다는 게 바로 보이게 회색으로 채운다.
    '&:disabled:not([aria-pressed="true"])': {
      cursor: 'not-allowed',
      background: color.background.surface,
      borderColor: color.background.surface,
      color: color.text.disabled,
    },
    '&[aria-pressed="true"], &[aria-pressed="true"]:hover:not(:disabled)': {
      background: color.primary.base,
      borderColor: color.primary.base,
      color: color.text.inverse,
    },
  },
})

export const note = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// 늘려 둔 상태 — 대기 인원이 부풀어 보인다는 대가를 빨간 글자로 알린다.
export const noteWarn = style([
  typography.body.sub,
  { color: color.status.danger },
])
