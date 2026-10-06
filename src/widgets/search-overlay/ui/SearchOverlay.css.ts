import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  onDark,
  spacing,
  typography,
} from '@shared/config/theme'

// 테마와 상관없이 어두운 화면이다(디자인 기준) — 글자·선은 onDark로 흰색 투명도만 바꾼다.
const label = onDark(64)
const divider = `1px solid ${onDark(8)}`
const chipBorder = `1px solid ${onDark(18)}`
const cardBorder = `1px solid ${onDark(10)}`

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

export const field = style({
  flex: 1,
  minWidth: 0,
  boxSizing: 'border-box',
  height: '52px',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  padding: `0 ${spacing[8]} 0 18px`,
  borderRadius: '26px',
  background: color.backgroundDark.surface,
  border: `1.5px solid ${color.primary.base}`,
})

export const fieldIcon = style({
  flexShrink: 0,
  width: '20px',
  height: '20px',
  color: label,
})

export const input = style([
  typography.body.defaultRegular,
  {
    flex: 1,
    minWidth: 0,
    height: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'inherit',
    selectors: {
      '&::placeholder': { color: onDark(45) },
      // 브라우저 기본 지우기(✕) 대신 아래 clear 버튼을 쓴다.
      '&::-webkit-search-cancel-button': { display: 'none' },
    },
  },
])

const roundButton = style({
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
})

export const clear = style([
  roundButton,
  {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: onDark(12),
  },
])

export const cancel = style({
  flexShrink: 0,
  height: '44px',
  padding: `0 ${spacing[6]}`,
  border: 'none',
  background: 'transparent',
  color: onDark(90),
  cursor: 'pointer',
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
})

export const sectionHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const sectionTitle = style([
  typography.body.captionMedium,
  { margin: 0, color: label },
])

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

const list = style({ margin: 0, padding: 0, listStyle: 'none' })

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

export const preorders = style([
  list,
  { display: 'flex', flexDirection: 'column', gap: spacing[10] },
])

export const preorder = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[14],
  padding: `${spacing[14]} ${spacing[16]}`,
  borderRadius: '14px',
  background: color.backgroundDark.surface,
  border: cardBorder,
  color: 'inherit',
  textDecoration: 'none',
})

export const preorderStatus = styleVariants(
  { open: color.status.success, upcoming: color.primary.subtle },
  (statusColor) => [
    typography.body.captionMedium,
    {
      flexShrink: 0,
      padding: `3px ${spacing[8]}`,
      borderRadius: '6px',
      background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
      color: statusColor,
    },
  ],
)

export const preorderTitle = style([
  typography.body.subSemibold,
  { flex: 1, minWidth: 0 },
])

export const preorderChevron = style({
  flexShrink: 0,
  width: '18px',
  height: '18px',
  color: onDark(55),
})

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

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: spacing[12],
  // 좁은 화면에선 180px 기준이면 한 줄에 하나라 카드가 너무 커진다 — 두 개씩 둔다.
  '@media': {
    [breakpoint.mobile]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  padding: spacing[12],
  borderRadius: '14px',
  background: color.backgroundDark.surface,
  border: cardBorder,
  color: 'inherit',
  textDecoration: 'none',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&[href]:hover': { borderColor: color.primary.base },
  },
})

export const cardImage = style({
  boxSizing: 'border-box',
  aspectRatio: '1.15',
  padding: spacing[8],
  borderRadius: '10px',
  overflow: 'hidden',
})

export const image = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

export const cardName = style({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
})

export const empty = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[8],
  padding: `${spacing[40]} 0 ${spacing[8]}`,
  textAlign: 'center',
})

export const emptyTitle = style([typography.title.mdSemibold, { margin: 0 }])

export const emptyHint = style([
  typography.body.sub,
  { margin: 0, color: label },
])

// ProductRanking과 같은 흐르는 빛 스켈레톤.
const shimmer = keyframes({
  '0%': { backgroundPosition: '100% 0' },
  '100%': { backgroundPosition: '-100% 0' },
})

export const skeleton = style({
  background: `linear-gradient(90deg, ${onDark(6)} 0%, ${onDark(6)} 35%, ${onDark(12)} 50%, ${onDark(6)} 65%, ${onDark(6)} 100%)`,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.4s linear infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})

export const lineSkeleton = style([
  skeleton,
  { height: '14px', borderRadius: '5px' },
])

export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
})
