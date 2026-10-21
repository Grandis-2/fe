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
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const list = style({
  containerType: 'inline-size',
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

// 좁으면(목록 폭 기준) 한 줄에 다 못 놓아 이름·버튼 / 대기 둘 / 외부 등록 / 상한으로 쌓는다.
const narrow = '(max-width: 680px)'

// 윗줄: 이름 · 대기 · 맨 뒤 대기 · 외부 등록 · 버튼. 아랫줄: 상한 사용(줄 전체 너비).
export const row = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 96px 96px 180px auto',
  '@container': {
    [narrow]: { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' },
  },
  alignItems: 'center',
  gap: `${spacing[10]} ${spacing[16]}`,
  padding: `${spacing[14]} 0`,
  borderTop: `1px solid ${color.border.subtle}`,
  selectors: { '&:first-child': { borderTop: 'none', paddingTop: spacing[4] } },
})

export const name = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: spacing[4],
})

export const nameText = style([
  typography.title.mdMedium,
  {
    maxWidth: '100%',
    fontWeight: fontWeight.semibold,
    color: color.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
])

export const stat = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const statLabel = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const statValue = style([
  typography.title.mdMedium,
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

export const register = style({
  display: 'flex',
  '@container': { [narrow]: { gridColumn: '1 / -1' } },
})

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[6],
  '@container': { [narrow]: { gridColumn: 2, gridRow: 1 } },
})

const buttonBase = style([
  typography.button.mdBold,
  { fontWeight: fontWeight.medium },
  {
    minHeight: '34px',
    padding: `0 ${spacing[14]}`,
    borderRadius: '999px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: { '&:disabled': { cursor: 'not-allowed', opacity: 0.5 } },
  },
])

export const resetButton = style([
  buttonBase,
  {
    border: 'none',
    background: 'none',
    color: color.text.secondary,
    selectors: { '&:hover': { color: color.text.primary } },
  },
])

// 상한에 닿은 상품만 진하게 — 이 상품이 막히는 곳이라는 걸 버튼으로도 보인다.
export const capButton = styleVariants({
  plain: [
    buttonBase,
    {
      border: `1px solid ${color.border.default}`,
      background: color.background.base,
      color: color.text.primary,
      selectors: { '&:hover': { background: color.background.surface } },
    },
  ],
  strong: [
    buttonBase,
    {
      border: `1px solid ${color.primary.base}`,
      background: color.primary.base,
      color: color.text.inverse,
      selectors: { '&:hover': { filter: 'brightness(0.92)' } },
    },
  ],
})

// 상한 사용 — 윗줄 상품에 딸린 정보라 회색 바탕으로 묶는다.
export const capBox = style({
  gridColumn: '1 / -1',
  display: 'grid',
  gridTemplateColumns: '170px minmax(0, 1fr)',
  alignItems: 'center',
  '@container': { [narrow]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
  gap: `${spacing[4]} ${spacing[16]}`,
  padding: `${spacing[10]} ${spacing[14]}`,
  borderRadius: '10px',
  background: color.background.surface,
})

export const capHead = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const capLabel = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const capValue = style([
  typography.title.lgSemibold,
  {
    whiteSpace: 'nowrap',
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

// 단위는 숫자보다 작고 옅게 — 숫자 둘이 먼저 읽힌다.
export const capUnit = style([
  typography.body.sub,
  { marginLeft: spacing[4], color: color.text.secondary },
])

export const hint = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// 주황 칸과 짝 — 글자는 읽히게 기본 색에 굵기만 올린다.
export const hintWarn = style([
  typography.body.sub,
  { color: color.text.primary, fontWeight: fontWeight.semibold },
])

export const hintSub = style({
  color: color.text.tertiary,
  fontWeight: fontWeight.regular,
})
