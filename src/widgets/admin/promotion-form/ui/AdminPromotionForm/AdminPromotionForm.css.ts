import { style } from '@vanilla-extract/css'

import {
  ADMIN_FORM_MAX_WIDTH,
  color,
  spacing,
  typography,
} from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  width: '100%',
  // 상품 폼과 같은 폭
  maxWidth: ADMIN_FORM_MAX_WIDTH,
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: `${spacing[20]} ${spacing[24]}`,
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  background: color.background.base,
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

export const footerIcon = style({
  width: '16px',
  height: '16px',
  flexShrink: 0,
})

/** 저장 줄의 바뀐 곳 요약 — 실패 문구가 아니라 회색으로 */
export const saveSummary = style([
  typography.body.subMedium,
  { color: color.text.secondary },
])

export const saveCount = style({
  color: color.text.primary,
})
