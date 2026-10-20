import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

import { panel } from '../panel.css'

// 한 화면(1440×900 안팎)에 스크롤 없이 들어가게 줄 간격을 좁게 둔다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const topBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

// 다른 관리자 화면(예약 현황·대기열 관리)의 제목과 같은 크기다.
export const pageTitle = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

// 결제를 막는 일 — 빨간 테두리 카드로 따로 둔다.
export const urgentBar = style({
  // 결제를 막는 일이라 아래로 스크롤해도 본문 스크롤 영역 위쪽에 붙어 보이게 한다.
  position: 'sticky',
  top: 0,
  // 그래프 툴팁·표보다 위에 뜬다.
  zIndex: 10,
  padding: `${spacing[4]} ${spacing[20]}`,
  borderRadius: '12px',
  border: `1px solid ${color.status.danger}`,
  // 뒤의 카드가 비치지 않게 불투명한 바탕을 깐다.
  background: color.background.base,
})

export const section = style({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[20],
  alignItems: 'center',
})

export const sectionTitle = style([
  typography.title.lgSemibold,
  { margin: 0, color: color.text.primary },
])

export const kpis = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: spacing[12],
})

export const mainRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
  gap: spacing[16],
  '@media': {
    'screen and (min-width: 1200px)': {
      gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
    },
  },
})

export const bottomRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
  gap: spacing[16],
})

export const flowPanel = panel
export const taskPanel = panel
export { panelHeader, panelTitle } from '../panel.css'

export const verdict = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[4],
})

export const taskSkeleton = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const allClear = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    padding: `${spacing[12]} 0`,
    color: color.text.secondary,
  },
])

export const caption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const panelHeaderGap = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
})
