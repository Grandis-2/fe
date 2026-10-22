import { style } from '@vanilla-extract/css'

import { breakpoint, typography, spacing } from '@shared/config/theme'

export const title = style([
  typography.title.xlSemibold,
  {
    marginBottom: spacing[30],
    // 모바일은 헤더가 같은 제목을 띄운다(getMobileTitle).
    '@media': { [breakpoint.mobile]: { display: 'none' } },
  },
])
