import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  onDark,
  spacing,
  typography,
} from '@shared/config/theme'
import { fontFamily } from '@shared/config/theme/tokens/typography/base'

// 장면(캔버스)을 맨 뒤에 깔고 로고는 위, 소개는 아래에 둔다.
export const root = style({
  position: 'relative',
  overflow: 'hidden',
  flex: '1 1 560px',
  minWidth: 0,
  minHeight: '100vh',
  boxSizing: 'border-box',
  padding: `${spacing[60]} 64px`,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: spacing[40],
  background: color.backgroundDark.base,
  color: color.text.inverse,
  '@media': {
    // 모바일은 폼 위에 쌓인다 — 장면을 다 보이려고 화면 하나를 쓰지 않는다.
    [breakpoint.mobile]: {
      minHeight: '420px',
      padding: `${spacing[32]} ${spacing[24]}`,
    },
  },
})

export const canvas = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  display: 'block',
})

// 흰 점과 겹쳐도 소개 글이 읽히게 아래쪽만 바탕색으로 덮는다.
export const scrim = style({
  position: 'absolute',
  insetInline: 0,
  bottom: 0,
  height: '46%',
  background: `linear-gradient(180deg, transparent 0%, color-mix(in srgb, ${color.backgroundDark.base} 82%, transparent) 55%, ${color.backgroundDark.base} 100%)`,
  pointerEvents: 'none',
})

export const brand = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
})

export const logo = style({ fontSize: '22px' })

export const badge = style({
  fontFamily: fontFamily.michroma,
  fontSize: '12px',
  letterSpacing: '0.24em',
  padding: `${spacing[4]} ${spacing[10]}`,
  border: `1px solid ${onDark(40)}`,
  borderRadius: '9999px',
})

export const intro = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const copy = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  maxWidth: '480px',
})

export const title = style([
  typography.title.xxlSemibold,
  {
    margin: 0,
    fontWeight: 700,
    textWrap: 'balance',
    '@media': {
      // 시안 값 — 32px 위로는 맞는 글자 크기 토큰이 없다.
      [breakpoint.desktop]: { fontSize: '44px' },
    },
  },
])

export const description = style([
  typography.body.defaultRegular,
  { color: onDark(78) },
])

export const areas = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const area = style([
  typography.body.subMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '32px',
    padding: `0 ${spacing[14]}`,
    borderRadius: '9999px',
    border: `1px solid ${onDark(18)}`,
    background: color.backgroundDark.base,
    color: onDark(78),
  },
])
