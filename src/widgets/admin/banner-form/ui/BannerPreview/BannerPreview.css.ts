import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  lineClamp,
  spacing,
  typography,
} from '@shared/config/theme'

// 고객 메인 배너(widgets/banner)의 데스크톱 모양을 폼 폭에 맞춰 줄인 것 — 위젯끼리
// import하지 않는 규칙이라 모양만 따라 그린다.
export const root = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)',
  alignItems: 'center',
  gap: spacing[24],
  padding: spacing[32],
  borderRadius: '12px',
  background: [
    `radial-gradient(55% 70% at 0% 0%, ${color.secondary.base}, transparent 72%)`,
    `radial-gradient(45% 60% at 36% 0%, color-mix(in srgb, ${color.primary.base} 85%, transparent), transparent 70%)`,
    color.backgroundDark.base,
  ].join(', '),
  color: color.text.inverse,
  // 좁은 모달에선 글과 사진이 폭을 나누면 읽기 어렵다 — 위아래로 쌓는다.
  '@media': {
    [breakpoint.mobile]: { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
})

export const text = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[30],
  minWidth: 0,
})

export const title = style([
  typography.title.xlSemibold,
  { marginTop: spacing[12], whiteSpace: 'pre-line', overflowWrap: 'anywhere' },
])

export const description = style([
  typography.body.defaultRegular,
  { marginTop: spacing[16], whiteSpace: 'pre-line', overflowWrap: 'anywhere' },
])

// 아직 안 쓴 칸은 흐린 글자로 자리만 보인다.
export const empty = style({ opacity: 0.4 })

export const tab = style([
  typography.body.subMedium,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing[8],
    maxWidth: '160px',
  },
])

export const progress = style({
  alignSelf: 'stretch',
  height: '3px',
  marginBottom: spacing[4],
  background: color.primary.subtle,
})

export const tabLabel = style({ ...lineClamp(2), whiteSpace: 'pre-line' })

export const visual = style({
  aspectRatio: '718 / 460',
  borderRadius: '8px',
  overflow: 'hidden',
})

// 사진을 올리기 전 자리만 보인다 — 투명 PNG 뒤로 비치지 않게 사진이 없을 때만 깐다.
export const visualEmpty = style({
  background: `color-mix(in srgb, ${color.text.inverse} 8%, transparent)`,
})

export const image = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: '70% 50%',
})
