import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  onDark,
  spacing,
  typography,
} from '@shared/config/theme'
import { maxWidth } from '@shared/config/theme/tokens/container'

import { fluid } from '../../lib/fluid'

// 사용자 페이지 공통 하단 — 사용자 페이지는 늘 어둡다(관리자 레이아웃엔 없다).
export const root = style({
  position: 'relative',
  overflow: 'hidden',
  background: color.backgroundDark.base,
  color: color.text.inverse,
  wordBreak: 'keep-all',
})

// 가운데만 밝은 위쪽 경계선.
export const topLine = style({
  height: '1px',
  background: `linear-gradient(90deg, transparent 0%, ${onDark(28)} 30%, ${onDark(28)} 70%, transparent 100%)`,
})

// 헤더와 같은 좌우 여백(데스크톱 40px, 모바일 16px).
export const inner = style({
  boxSizing: 'border-box',
  maxWidth: maxWidth.content,
  margin: '0 auto',
  padding: `${spacing[60]} ${spacing[40]} 0`,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[40],
  '@media': {
    [breakpoint.mobile]: {
      padding: `${spacing[40]} ${spacing[16]} 0`,
      gap: spacing[32],
    },
  },
})

// 데스크톱: 왼쪽 궤도 + 오른쪽(브랜드·구분선·팀원 상세). 모바일: 브랜드 → 원형 궤도 → 상세.
export const main = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gridTemplateRows: 'auto',
  gridTemplateAreas: '"brand" "orbitMobile" "detail"',
  rowGap: spacing[24],
  '@media': {
    [breakpoint.desktop]: {
      gridTemplateColumns: 'minmax(0, 3fr) minmax(220px, 1fr)',
      gridTemplateRows: 'auto auto 1fr',
      gridTemplateAreas: '"orbit brand" "orbit divider" "orbit detail"',
      columnGap: spacing[40],
      rowGap: fluid(20, 28),
    },
  },
})

export const orbit = style({
  gridArea: 'orbit',
  minWidth: 0,
  '@media': { [breakpoint.mobile]: { display: 'none' } },
})

export const orbitMobile = style({
  gridArea: 'orbitMobile',
  minWidth: 0,
  '@media': { [breakpoint.desktop]: { display: 'none' } },
})

export const brand = style({
  gridArea: 'brand',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
  '@media': { [breakpoint.mobile]: { gap: spacing[10] } },
})

// 로고 글자에 브랜드 그라데이션을 입힌다.
export const logo = style({
  alignSelf: 'flex-start',
  fontSize: fluid(18, 22),
  textDecoration: 'none',
  backgroundImage: `linear-gradient(120deg, ${color.primary.subtler} 0%, ${color.primary.subtle} 55%, ${color.secondary.subtle} 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
  '@media': { [breakpoint.mobile]: { fontSize: '20px' } },
})

export const tagline = style([typography.body.caption, { color: onDark(64) }])

export const divider = style({
  gridArea: 'divider',
  height: '1px',
  background: `linear-gradient(90deg, ${onDark(20)}, transparent)`,
  '@media': { [breakpoint.mobile]: { display: 'none' } },
})

export const detail = style({ gridArea: 'detail' })

export const bottom = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: `${spacing[6]} ${spacing[32]}`,
  padding: `${spacing[20]} 0 ${spacing[30]}`,
  borderTop: `1px solid ${onDark(8)}`,
})

export const note = style([typography.body.caption, { color: onDark(45) }])
