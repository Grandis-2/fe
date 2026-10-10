import { keyframes, style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  spacing,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
  typography,
} from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

const divider = `1px solid ${color.border.subtle}`

// 열 때 마운트되므로 첫 프레임부터 재생되는 keyframes로 충분하다(SearchOverlay와 같은 등장).
const fadeIn = keyframes({ from: { opacity: 0 } })

// 하단 탭바(zIndex 31) 바로 아래 — 탭바는 메뉴 위에 그대로 떠 있다.
export const root = style({
  position: 'fixed',
  inset: 0,
  zIndex: 30,
  overflowY: 'auto',
  // 끝에 닿은 스크롤이 뒤 페이지로 넘어가지 않게 끊는다.
  overscrollBehavior: 'contain',
  background: color.backgroundDark.base,
  color: color.text.primary,
  animation: `${fadeIn} ${motion.duration.normal} ${motion.easing.out}`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
    // 탭바가 없는 넓은 화면에선 띄우지 않는다(열린 채로 창을 넓혀도 사라진다).
    [breakpoint.desktop]: { display: 'none' },
  },
})

// 제목과 탭은 스크롤해도 위에 붙어 있고, 아래 내용이 흐리게 비친다.
export const top = style({
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: `color-mix(in srgb, ${color.backgroundDark.base} 72%, transparent)`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
})

export const titleRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '56px',
  // X 버튼은 패딩까지가 터치 영역이라 오른쪽 끝을 제목 여백보다 조금 당긴다.
  padding: `0 ${spacing[12]} 0 ${spacing[20]}`,
})

export const title = style([
  typography.title.lgSemibold,
  { fontWeight: fontWeight.bold },
])

// 모달 닫기 버튼(Modal.css의 closeButton)과 같은 모양 — 글자색을 옅게 깐 원으로만 hover를 보인다.
export const close = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  background: 'transparent',
  color: color.text.secondary,
  cursor: 'pointer',
  transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover, &:active': {
      background: 'color-mix(in srgb, currentColor 14%, transparent)',
    },
  },
})

export const tabs = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  paddingInline: spacing[20],
  borderBottom: divider,
})

export const tab = style([
  typography.body.defaultRegular,
  {
    height: '48px',
    marginBottom: '-1px',
    border: 'none',
    borderBottom: '2px solid transparent',
    background: 'transparent',
    color: color.text.tertiary,
    cursor: 'pointer',
    transition: [
      `color ${motion.duration.fast} ${motion.easing.default}`,
      `border-color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&[aria-selected="true"]': {
        borderBottomColor: color.primary.subtle,
        color: color.text.primary,
        fontWeight: fontWeight.bold,
      },
    },
  },
])

// 맨 아래는 떠 있는 탭바가 가리지 않게 그만큼 더 비운다.
export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  padding: spacing[20],
  paddingBottom: `calc(${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET} + ${spacing[40]})`,
})

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  selectors: { '& + &': { marginTop: spacing[4] } },
})

export const groupTitle = style([
  typography.body.defaultMedium,
  {
    fontWeight: fontWeight.bold,
    color: color.text.primary,
    textDecoration: 'none',
  },
])

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: spacing[10],
})

const tileBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '14px',
  border: divider,
  background: color.background.base,
  color: color.text.primary,
  textDecoration: 'none',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: { '&:active': { borderColor: color.border.hover } },
} as const

export const categoryTile = style([
  typography.body.subSemibold,
  {
    ...tileBase,
    flexDirection: 'column',
    gap: spacing[10],
    height: '104px',
  },
])

export const categoryThumbnail = style({
  width: '64px',
  height: '44px',
  objectFit: 'contain',
})

export const brandTile = style([
  typography.body.defaultMedium,
  {
    ...tileBase,
    height: '52px',
    fontWeight: fontWeight.bold,
  },
])

export const eventCard = style({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '18px',
  border: divider,
  background: color.background.base,
  color: color.text.primary,
  textDecoration: 'none',
})

export const eventImage = style({
  display: 'block',
  width: '100%',
  height: '180px',
  objectFit: 'cover',
  background: color.background.surface,
})

export const eventTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  padding: spacing[16],
})

// Tag small(10px)은 카드 제목 옆에서 작다 — 12px로 키운다(HistoryCard 태그와 같음).
export const eventTag = style({
  alignSelf: 'flex-start',
  fontSize: fontSize[12],
  fontWeight: fontWeight.bold,
  padding: `3px ${spacing[8]}`,
})

export const eventTitle = style([
  typography.body.defaultMedium,
  { fontWeight: fontWeight.bold, textWrap: 'pretty' },
])

export const eventPeriod = style([
  typography.body.sub,
  { color: color.text.tertiary },
])
