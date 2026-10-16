import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  spacing,
  typography,
} from '@shared/config/theme'
import { maxWidth } from '@shared/config/theme/tokens/container'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'
import { headerHeight } from '@widgets/header'

// 위에서 내려오는 주문바(Container, 1200px · 좌우 50px)와 글 시작선을 맞춘다.
const sidePadding = `clamp(20px, 4vw, ${spacing[50]})`

// 어두운 페이지 — 헤더 높이만큼 끌어올려 헤더 뒤까지 바탕을 깐다(data-header-theme="dark").
export const root = style({
  boxSizing: 'border-box',
  minHeight: '100vh',
  marginTop: `calc(-1 * ${headerHeight})`,
  paddingTop: headerHeight,
  background: color.backgroundDark.base,
  color: color.text.primary,
})

export const content = style({
  boxSizing: 'border-box',
  maxWidth: '1600px',
  margin: '0 auto',
  // 헤더 바로 밑에 붙으면 시선이 화면 맨 위로 올라가야 해서 위를 넉넉히 비운다.
  padding: `${spacing[80]} ${sidePadding} ${spacing[90]}`,
  '@media': {
    [breakpoint.mobile]: {
      padding: `${spacing[20]} ${spacing[16]} ${spacing[40]}`,
    },
  },
})

// 모바일: 하단 고정 주문바가 겹칠 일이 없어 top은 항상 0.
// 데스크톱: 위에서 내려오는 주문바가 보이면 그 높이(--order-bar-offset)만큼 밀려 겹치지 않는다.
export const tabBarWrapper = style({
  position: 'sticky',
  top: 0,
  zIndex: 1,
  '@media': {
    [breakpoint.desktop]: {
      top: 'var(--order-bar-offset, 0px)',
      transition: `top ${motion.duration.fast} ${motion.easing.default}`,
    },
  },
})

export const sections = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '80px',
  maxWidth: maxWidth.content,
  margin: '0 auto',
  padding: `56px ${sidePadding} 160px`,
  '@media': {
    [breakpoint.mobile]: {
      gap: spacing[50],
      padding: `${spacing[32]} ${spacing[16]} ${spacing[40]}`,
    },
  },
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  // 위에 고정되는 주문바(72px) + 탭(56px)에 가리지 않게 띄운다.
  scrollMarginTop: '140px',
  '@media': {
    // 모바일은 주문바가 하단이라 탭(44px)만 위에 고정된다.
    [breakpoint.mobile]: { scrollMarginTop: '60px' },
  },
})

export const sectionTitle = style([
  typography.title.xlSemibold,
  {
    margin: 0,
    fontWeight: fontWeight.bold,
    '@media': { [breakpoint.mobile]: { fontSize: fontSize[20] } },
  },
])

export const reviewList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})
