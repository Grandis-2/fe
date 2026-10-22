import { style } from '@vanilla-extract/css'

import { color, shadow, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  width: '100%',
  // 상품 폼과 같은 폭 — 관리자 폼이 화면을 다 쓰면 한 줄이 너무 길어진다.
  maxWidth: '1000px',
})

export const toc = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[6],
})

export const tocLink = style([
  typography.body.subSemibold,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[6],
    minHeight: '36px',
    padding: `0 ${spacing[12]}`,
    borderRadius: '999px',
    border: `1px solid ${color.border.default}`,
    background: color.background.base,
    color: color.text.primary,
    textDecoration: 'none',
    selectors: {
      '&:hover': { borderColor: color.border.hover },
    },
  },
])

export const tocDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '999px',
  background: color.status.warning,
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: `${spacing[20]} ${spacing[24]}`,
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  background: color.background.base,
  // 목차로 건너왔을 때 위에 붙지 않게
  scrollMarginTop: spacing[20],
})

export const sectionTitle = style([
  typography.title.mdSemibold,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    margin: 0,
    color: color.text.primary,
  },
])

export const changed = style([
  typography.body.caption,
  {
    padding: `${spacing[2]} ${spacing[8]}`,
    borderRadius: '999px',
    background: color.background.subtleWarning,
    color: color.text.primary,
  },
])

export const description = style([
  typography.body.sub,
  { marginTop: `-${spacing[8]}`, color: color.text.secondary },
])

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const counter = style([
  typography.body.caption,
  {
    alignSelf: 'flex-end',
    color: color.text.tertiary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const hint = style([typography.body.sub, { color: color.text.tertiary }])

export const warn = style([
  typography.body.subSemibold,
  { color: color.status.danger },
])

/** 상세 이미지처럼 타일이 늘어서는 자리를 감싸는 테두리 */
export const tileFrame = style({
  padding: spacing[16],
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  background: color.background.base,
})

// 아래에 붙어 따라오는 저장 줄 — 긴 폼을 내려가도 바뀐 내용과 저장이 늘 보인다.
export const saveBar = style({
  position: 'sticky',
  bottom: spacing[16],
  zIndex: 1,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
  marginTop: spacing[8],
  padding: `${spacing[12]} ${spacing[20]}`,
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  background: color.background.base,
  boxShadow: shadow.md,
})

export const saveSummary = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const saveCount = style({
  color: color.text.primary,
})

export const saveActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[8],
  marginLeft: 'auto',
})
