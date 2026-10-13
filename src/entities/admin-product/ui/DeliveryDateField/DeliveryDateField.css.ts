import { style } from '@vanilla-extract/css'

import {
  color,
  motion,
  shadow,
  spacing,
  typography,
} from '@shared/config/theme'

export const root = style({
  position: 'relative',
})

/** 두 변형이 함께 쓰는 바탕 — 높이·배경·hover 테두리는 같다 */
const boxBase = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  height: '46px',
  background: color.background.base,
  cursor: 'pointer',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { borderColor: color.primary.base },
  },
})

// compact — 표 칸에서 좁게 쓴다. 아이콘까지 한 박스에 담아 왼쪽 정렬.
const triggerBase = style([
  boxBase,
  typography.body.sub,
  {
    gap: spacing[8],
    width: '100%',
    padding: `0 ${spacing[12]}`,
    borderRadius: '8px',
    border: `1px solid ${color.primary.surface}`,
    textAlign: 'left',
  },
])

export const trigger = style([triggerBase, { color: color.text.primary }])

export const triggerEmpty = style([triggerBase, { color: color.text.tertiary }])

export const icon = style({
  width: '18px',
  height: '18px',
  flexShrink: 0,
  color: color.text.tertiary,
})

export const text = style({
  flex: '1 1 0%',
  minWidth: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

// body에 포털로 붙으므로 화면 기준(fixed)으로 배치한다.
export const popover = style({
  position: 'fixed',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
  boxShadow: shadow.md,
  overflow: 'hidden',
})

// 팝오버가 카드 역할을 하므로 달력 자체의 테두리·그림자는 지운다.
export const calendar = style({
  border: 'none',
  borderRadius: 0,
  boxShadow: 'none',
})

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
  padding: `${spacing[10]} ${spacing[16]} ${spacing[16]}`,
})

export const hint = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const undecidedButton = style([
  typography.body.caption,
  {
    flexShrink: 0,
    padding: `${spacing[6]} ${spacing[10]}`,
    border: `1px solid ${color.border.default}`,
    borderRadius: '6px',
    background: 'transparent',
    color: color.text.secondary,
    cursor: 'pointer',
    transition: [
      `border-color ${motion.duration.fast} ${motion.easing.default}`,
      `color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover': {
        borderColor: color.primary.base,
        color: color.primary.base,
      },
    },
  },
])

/* ------------------------------------------------------------------ *
 * variant 'field' — 폼 한 줄에 들어갈 때.
 * 아이콘을 박스 밖에 두고 박스는 가운데 정렬로, 같은 섹션에 서는 다른
 * 일시 입력칸과 높이·라운드·테두리를 맞춘다.
 * ------------------------------------------------------------------ */

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

// 누르는 건 옆 박스 하나뿐이라 버튼이 아니라 장식이다.
export const iconBox = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '32px',
  height: '32px',
  color: color.text.tertiary,
})

export const iconLarge = style({
  width: '24px',
  height: '24px',
})

// field — 폼 한 줄에서 옆 입력칸과 나란히 선다. 아이콘은 밖, 글자는 가운데.
const summaryBase = style([
  boxBase,
  typography.body.defaultRegular,
  {
    flex: '1 1 0%',
    minWidth: 0,
    justifyContent: 'center',
    padding: `0 ${spacing[16]}`,
    borderRadius: '12px',
    border: `1px solid ${color.border.default}`,
    textAlign: 'center',
  },
])

export const summary = style([summaryBase, { color: color.text.primary }])

export const summaryEmpty = style([summaryBase, { color: color.text.tertiary }])
