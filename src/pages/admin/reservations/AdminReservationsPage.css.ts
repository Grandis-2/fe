import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
})

export const title = style([
  typography.title.xlSemibold,
  { color: color.text.primary },
])

// 탭 이름 옆에 그 상태의 전체 건수를 붙인다.
export const tabLabel = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: spacing[6],
})

export const tabCount = style({
  fontVariantNumeric: 'tabular-nums',
  opacity: 0.8,
})

// 경고 문구 안의 링크라 문구 색을 그대로 따른다.
export const link = style({
  color: 'inherit',
  fontWeight: fontWeight.semibold,
  textDecoration: 'underline',
})

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: spacing[12],
})

export const controls = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
})

export const searchBox = style({
  width: '200px',
})

export const reservationNo = style([
  typography.body.subMedium,
  { color: color.text.primary },
])

/** Tag 아래에 사유·남은 시간 같은 보조 문구를 한 줄 더 붙이는 칸 */
export const stackedCell = style({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[4],
})

export const subText = style([
  typography.body.caption,
  { color: color.text.secondary },
])

export const dueText = style([
  typography.body.caption,
  { color: color.primary.base },
])
