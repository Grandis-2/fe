import { style } from '@vanilla-extract/css'

import {
  typography,
  color,
  spacing,
  breakpoint,
  lineClamp,
} from '@/shared/config/theme'
import { fontSize } from '@/shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  width: '100%',
  minWidth: '230px',
  borderRadius: '8px',
  background: color.background.base,
  overflow: 'hidden',
  cursor: 'pointer',
  '@media': {
    // 모바일은 2열 그리드라 카드 폭이 230px보다 좁다 — minWidth를 풀지 않으면 1열로 밀린다.
    [breakpoint.mobile]: { minWidth: 0 },
  },
})

export const image = style({
  width: '100%',
  aspectRatio: '1 / 1',
  borderRadius: '8px',
  objectFit: 'cover',
  background: color.background.surface,
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  width: '100%',
  padding: `${spacing[12]} ${spacing[8]}`,
  '@media': {
    [breakpoint.mobile]: {
      gap: spacing[6],
      padding: `${spacing[10]} ${spacing[4]}`,
    },
  },
})

export const title = style([
  typography.title.mdMedium,
  {
    color: color.text.primary,
    ...lineClamp(2),
    // 모바일만 작게 — 14px 타이틀 토큰이 없어 mdMedium의 크기만 덮어쓴다.
    '@media': { [breakpoint.mobile]: { fontSize: fontSize[14] } },
  },
])

export const period = style([
  typography.body.sub,
  {
    color: color.text.tertiary,
    '@media': { [breakpoint.mobile]: { fontSize: fontSize[12] } },
  },
])
