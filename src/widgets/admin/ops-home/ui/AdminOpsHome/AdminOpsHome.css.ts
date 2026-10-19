import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const sectionTitle = style([
  typography.title.mdSemibold,
  { margin: 0, color: color.text.primary },
])

export const taskSkeleton = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const allClear = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    color: color.text.secondary,
  },
])

/** 섹션 내용을 감싸는 흰 카드 */
export const card = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const cardHeader = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const caption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

// 그래프가 어느 사전예약 기준인지 제목 옆에 붙인다.
export const scope = style([
  typography.body.subMedium,
  {
    marginLeft: spacing[8],
    padding: `${spacing[2]} ${spacing[8]}`,
    borderRadius: '6px',
    background: color.primary.subtler,
    color: color.primary.base,
    verticalAlign: 'middle',
  },
])
