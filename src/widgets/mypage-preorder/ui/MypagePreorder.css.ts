import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography, breakpoint } from '@/shared/config/theme'
import { fontWeight } from '@/shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  width: '100%',
})

export const card = style({
  boxSizing: 'border-box',
  width: '100%',
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

// 마감 문구와 결제 버튼을 한 줄에 양끝으로 둔다 — 각자 한 줄씩 차지하면
// 문구 오른쪽과 버튼 왼쪽에 빈 띠가 두 개 생긴다.
export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
  marginBottom: spacing[16],
  padding: `${spacing[10]} ${spacing[12]} ${spacing[10]} ${spacing[16]}`,
  borderRadius: '8px',
  border: '1px solid transparent',
})

// status 원색은 연한 배경 위 글자 대비가 부족해서 text.primary를 섞어 어둡게 깐다.
const textTone = (status: string) =>
  `color-mix(in srgb, ${status} 55%, ${color.text.primary})`
const borderTone = (status: string) =>
  `color-mix(in srgb, ${status} 24%, transparent)`

// 배경·보더·글자색을 한 세트로 묶는다 — 따로 두면 상태가 어긋나기 쉽다.
export const headerTone = styleVariants({
  active: {
    background: color.background.subtleWarning,
    borderColor: borderTone(color.status.warning),
    color: textTone(color.status.warning),
  },
  over: {
    background: color.background.subtleDanger,
    borderColor: borderTone(color.status.danger),
    color: textTone(color.status.danger),
  },
})

// 색은 header에서 상속받는다(아이콘도 currentColor로 따라온다).
export const deadline = style([
  typography.body.subMedium,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[6],
  },
])

// 매초 바뀌는 숫자라 폭이 흔들리지 않게 고정폭 숫자를 쓴다.
export const countdown = style({
  fontWeight: fontWeight.semibold,
  fontVariantNumeric: 'tabular-nums',
})

// 좁은 폭에선 버튼이 다음 줄로 내려가는데, 그때 왼쪽에만 걸쳐 있으면 어중간해 보인다.
export const headerAction = style({
  width: '100%',
  '@media': {
    [breakpoint.desktop]: { width: 'auto' },
  },
})
