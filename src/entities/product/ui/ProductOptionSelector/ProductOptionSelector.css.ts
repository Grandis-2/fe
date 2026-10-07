import { style, styleVariants } from '@vanilla-extract/css'

import { breakpoint, color, spacing } from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

const rootBase = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  background: 'transparent',
})

// small: 카드 안에서 쓴다 — 카드 자체가 이미 바깥 여백/간격을 관리하므로 padding 없이
// 라벨-옵션 간격만 좁게(8px) 붙인다.
// medium: 상세 페이지 옵션 패널 — 그룹 사이 간격은 패널의 gap이 준다.
export const root = styleVariants({
  small: [rootBase, { gap: spacing[8] }],
  medium: [rootBase, { gap: spacing[12] }],
})

export const label = style({ color: color.text.primary })

// medium(상세 옵션 패널) 제목은 모바일에서 한 단계 작게.
export const labelMedium = style({
  '@media': { [breakpoint.mobile]: { fontSize: fontSize[16] } },
})

const optionRowBase = style({ display: 'flex', alignItems: 'center' })

// medium은 옵션이 폭을 가득 채우는 타일(SelectButton medium)이라 세로로 쌓는다.
export const optionRow = styleVariants({
  small: [optionRowBase, { gap: spacing[6] }],
  medium: [
    optionRowBase,
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: spacing[12],
      '@media': { [breakpoint.mobile]: { gap: spacing[8] } },
    },
  ],
})
