import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { searchStyles } from '@features/search'
import {
  color,
  motion,
  onDark,
  spacing,
  typography,
} from '@shared/config/theme'

const { chipBorder, divider, label, list, roundButton } = searchStyles

// 열 때 마운트되므로 첫 프레임부터 재생되는 keyframes로 충분하다(@starting-style 불필요).
const fadeIn = keyframes({ from: { opacity: 0 } })
const fadeInAnimation = `${fadeIn} ${motion.duration.normal} ${motion.easing.out}`

export const dialog = style({
  animation: fadeInAnimation,
  // <dialog> 기본 여백·테두리·최대 크기를 걷어내고 화면 전체를 덮는다.
  boxSizing: 'border-box',
  width: '100%',
  maxWidth: 'none',
  height: '100%',
  maxHeight: 'none',
  margin: 0,
  padding: 0,
  border: 'none',
  overflowY: 'auto',
  background: color.backgroundDark.base,
  color: color.text.inverse,
  selectors: {
    '&::backdrop': {
      background: color.backgroundDark.base,
      animation: fadeInAnimation,
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
      selectors: { '&::backdrop': { animation: 'none' } },
    },
  },
})

export const inner = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[32],
  maxWidth: '840px',
  margin: '0 auto',
  padding: `${spacing[14]} clamp(20px, 4vw, 40px) ${spacing[100]}`,
})

export const bar = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  minHeight: '56px',
})

export const cancel = style({
  flexShrink: 0,
  height: '44px',
  padding: `0 ${spacing[6]}`,
  border: 'none',
  background: 'transparent',
  color: onDark(90),
  cursor: 'pointer',
})

export const sectionHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const textButton = style([
  typography.body.caption,
  {
    padding: spacing[4],
    border: 'none',
    background: 'transparent',
    color: onDark(55),
    cursor: 'pointer',
  },
])

export const chips = style([
  list,
  { display: 'flex', flexWrap: 'wrap', gap: spacing[8] },
])

export const recentChip = style({
  display: 'flex',
  alignItems: 'center',
  height: '36px',
  borderRadius: '18px',
  border: chipBorder,
  overflow: 'hidden',
})

export const recentLabel = style([
  typography.body.sub,
  {
    height: '100%',
    padding: `0 ${spacing[6]} 0 ${spacing[14]}`,
    border: 'none',
    background: 'transparent',
    color: onDark(90),
    cursor: 'pointer',
  },
])

export const recentRemove = style([
  roundButton,
  {
    height: '100%',
    padding: `0 ${spacing[12]} 0 ${spacing[4]}`,
    color: onDark(55),
  },
])

export const popular = style([
  list,
  {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    columnGap: spacing[32],
  },
])

export const popularItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[14],
  width: '100%',
  height: '44px',
  padding: 0,
  border: 'none',
  borderBottom: divider,
  background: 'transparent',
  color: onDark(90),
  textAlign: 'left',
  cursor: 'pointer',
})

export const popularRank = styleVariants(
  { top: color.primary.subtle, rest: onDark(55) },
  (rankColor) => [
    typography.button.mdBold,
    {
      width: '20px',
      flexShrink: 0,
      color: rankColor,
      fontVariantNumeric: 'tabular-nums',
    },
  ],
)

export const popularLabel = style([
  typography.body.defaultRegular,
  { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
])

export const categoryChip = style([
  typography.body.subMedium,
  {
    display: 'flex',
    alignItems: 'center',
    height: '40px',
    padding: `0 18px`,
    boxSizing: 'border-box',
    borderRadius: '20px',
    border: chipBorder,
    background: color.backgroundDark.surface,
    color: 'inherit',
    textDecoration: 'none',
    transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { borderColor: color.primary.subtle },
    },
  },
])

export const suggestions = style([
  list,
  { display: 'flex', flexDirection: 'column' },
])

export const suggestion = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[14],
    height: '48px',
    padding: `0 ${spacing[4]}`,
    borderBottom: divider,
    color: label,
    textDecoration: 'none',
  },
])

export const suggestionIcon = style({
  flexShrink: 0,
  width: '16px',
  height: '16px',
  color: onDark(55),
})

export const match = style({ color: color.text.inverse, fontWeight: 700 })
