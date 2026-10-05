import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[8],
})

export const removeButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  padding: 0,
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { color: color.status.danger },
  },
})

export const removeIcon = style({
  width: '20px',
  height: '20px',
})

export const addButton = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
    width: '100%',
    padding: spacing[10],
    border: 'none',
    borderRadius: '8px',
    background: color.primary.subtler,
    color: color.primary.base,
    cursor: 'pointer',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { background: color.primary.subtlerHover },
    },
  },
])

export const addIcon = style({
  width: '16px',
  height: '16px',
})

export const editFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
  flexWrap: 'wrap',
})

export const undeterminedNote = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const seqRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[8],
})

/** 계산된 시작 번호 — 입력칸이 아니라는 게 보이도록 글자로만 둔다 */
export const fromSeq = style([
  typography.body.sub,
  {
    minWidth: '56px',
    textAlign: 'right',
    color: color.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const tilde = style([
  typography.body.sub,
  { flexShrink: 0, color: color.text.tertiary },
])

export const toSeqField = style({
  width: '120px',
})

/** 저장할 수 없는 이유 — 저장 버튼 옆에서 왜 막혔는지 알려준다 */
export const problem = style([
  typography.body.sub,
  { color: color.status.danger },
])
