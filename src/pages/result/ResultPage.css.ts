import { style } from '@vanilla-extract/css'

import { color, spacing, typography, breakpoint } from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

// 주문 번호·결제 수단·배송지처럼 한 줄에 나란히 놓이는 요약 항목들.
// 모바일에선 세로로 쌓고, 데스크톱에서만 구분선으로 나눈다.
export const infoList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  '@media': {
    [breakpoint.desktop]: { flexDirection: 'row', gap: 0 },
  },
})

export const infoItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  minWidth: 0,
  '@media': {
    [breakpoint.desktop]: {
      flex: '1 1 0',
      selectors: {
        // 첫 항목 왼쪽에는 선이 없어야 해서 인접 형제에만 건다.
        '& + &': {
          paddingLeft: spacing[30],
          borderLeft: `1px solid ${color.border.default}`,
        },
      },
    },
  },
})

export const infoLabel = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const infoValue = style([
  typography.body.defaultRegular,
  { color: color.text.primary },
])

export const items = style({
  display: 'flex',
  flexDirection: 'column',
})

export const item = style({
  selectors: {
    '& + &': {
      marginTop: spacing[24],
      paddingTop: spacing[24],
      borderTop: `1px solid ${color.border.default}`,
    },
  },
})

// 합계 위의 굵은 선은 목록과 총액을 갈라주는 장치라 border.default보다 진하게 간다.
export const total = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: spacing[24],
  paddingTop: spacing[24],
  borderTop: `2px solid ${color.primary.focus}`,
})

export const totalLabel = style([
  typography.body.subMedium,
  { color: color.text.secondary },
])

export const totalValue = style([
  typography.title.xlSemibold,
  { color: color.text.primary },
])

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: spacing[12],
})

// 실패 화면 — 배너 아래가 통째로 비어 있어 가운데로 모은다.
export const failure = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[24],
  paddingTop: spacing[40],
})

export const failureIllustration = style({
  color: color.secondary.subtle,
})

export const failureMessage = style([
  typography.logo.wordmark,
  {
    fontSize: fontSize[32],
    color: color.primary.focus,
    textAlign: 'center',
  },
])
