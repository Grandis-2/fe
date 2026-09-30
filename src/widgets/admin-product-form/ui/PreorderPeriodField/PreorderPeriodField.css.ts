import { style } from '@vanilla-extract/css'

import {
  color,
  motion,
  spacing,
  typography,
  shadow,
} from '@/shared/config/theme'

export const root = style({
  position: 'relative',
})

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

export const iconButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '32px',
  height: '32px',
  padding: 0,
  border: 'none',
  borderRadius: '8px',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { color: color.primary.base },
  },
})

export const icon = style({
  width: '24px',
  height: '24px',
})

const summaryBase = style([
  typography.body.defaultRegular,
  {
    flex: '1 1 0%',
    minWidth: 0,
    // medium Input과 같은 높이·패딩·라운드로 맞춘다.
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '46px',
    padding: `0 ${spacing[16]}`,
    borderRadius: '12px',
    border: `1px solid ${color.border.default}`,
    background: color.background.base,
    textAlign: 'center',
    cursor: 'pointer',
    transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { borderColor: color.primary.base },
    },
  },
])

export const summary = style([summaryBase, { color: color.text.primary }])

export const summaryEmpty = style([summaryBase, { color: color.text.tertiary }])

export const popover = style({
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  zIndex: 20,
  // 달력과 시각 선택을 좌우로 붙여 한 덩어리로 보이게 한다.
  display: 'flex',
  alignItems: 'stretch',
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

export const timePanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  width: '180px',
  padding: spacing[16],
  borderLeft: `1px solid ${color.border.subtle}`,
})

export const timeTitle = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

export const timeLists = style({
  display: 'flex',
  gap: spacing[8],
  flex: '1 1 auto',
  minHeight: 0,
})

export const timeList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: '1 1 0%',
  // 목록이 항상 펼쳐진 채로 보이고, 넘치는 만큼만 스크롤된다.
  maxHeight: '240px',
  overflowY: 'auto',
  paddingRight: '2px',
})

const timeItemBase = style([
  typography.body.sub,
  {
    flexShrink: 0,
    padding: `${spacing[6]} 0`,
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: color.text.secondary,
    cursor: 'pointer',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { background: color.primary.subtler },
    },
  },
])

export const timeItem = style([timeItemBase])

export const timeItemActive = style([
  timeItemBase,
  {
    background: color.primary.base,
    color: color.text.inverse,
    selectors: {
      '&:hover': { background: color.primary.base },
    },
  },
])

export const closeHint = style([
  typography.body.caption,
  { color: color.text.tertiary },
])
