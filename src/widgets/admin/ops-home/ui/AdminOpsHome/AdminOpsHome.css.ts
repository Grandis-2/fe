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

// 그래프가 넓고 표가 좁다 — 좁은 화면에선 한 줄씩 쌓인다.
export const columns = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: spacing[16],
  // 나란한 카드는 높이를 맞춘다 — 윗선·아랫선이 어긋나면 서로 다른 덩어리로 읽힌다.
  alignItems: 'stretch',
})

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

export const link = style([
  typography.body.subMedium,
  { color: color.primary.base, textDecoration: 'underline' },
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
