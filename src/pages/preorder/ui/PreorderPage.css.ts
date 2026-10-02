import { style } from '@vanilla-extract/css'

import { typography, spacing, breakpoint } from '@/shared/config/theme'
import { fontSize } from '@/shared/config/theme/tokens/typography/base'

export const cardGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: spacing[24],
  '@media': {
    // 모바일은 2열 고정 — minmax(0, 1fr)로 긴 제목이 열 폭을 밀어내지 못하게 한다.
    [breakpoint.mobile]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: `${spacing[24]} ${spacing[12]}`,
    },
  },
})

export const title = style([
  typography.title.xlSemibold,
  {
    marginBottom: spacing[30],
    padding: `0 ${spacing[12]}`,
    '@media': {
      // 모바일만 작게 — 카드 좌측선(Container 16px 거터)에 맞추려고 좌우 패딩을 뺀다.
      [breakpoint.mobile]: {
        fontSize: fontSize[18],
        marginBottom: spacing[16],
        padding: 0,
      },
    },
  },
])
