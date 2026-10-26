import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const titleRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${spacing[12]} ${spacing[16]}`,
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

// 누구의 무슨 예약인지 — 아래로 내리지 않아도 보이게 제목 옆에 한 줄로.
export const summary = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

// 상태 태그와 떨어뜨려, 조치 버튼임을 드러낸다.
export const actions = style({
  display: 'flex',
  gap: spacing[8],
  marginLeft: 'auto',
})

// 왼쪽은 넓게 이력, 오른쪽은 좁게 자주 바뀌지 않는 참고 정보. 좁으면 아래로 내려간다.
export const columns = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[16],
  alignItems: 'flex-start',
})

export const main = style({ flex: '2 1 560px', minWidth: 0 })

export const side = style({
  flex: '1 1 320px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

/** 제목이 안에 들어간 흰 카드 */
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
  padding: `${spacing[20]} ${spacing[24]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  minWidth: 0,
})

export const panelHeader = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const panelTitle = style([
  typography.title.mdSemibold,
  { margin: 0, color: color.text.primary },
])

export const panelNote = style([
  typography.body.caption,
  { color: color.text.tertiary },
])

export const list = style({
  display: 'grid',
  gridTemplateColumns: '96px minmax(0, 1fr)',
  gap: `${spacing[12]} ${spacing[16]}`,
  margin: 0,
})

export const term = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const value = style([
  typography.body.defaultRegular,
  {
    margin: 0,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
    overflowWrap: 'anywhere',
  },
])

// 안내 오른쪽 조치 둘 — 좁으면 아래로 내린다.
export const bannerActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})
