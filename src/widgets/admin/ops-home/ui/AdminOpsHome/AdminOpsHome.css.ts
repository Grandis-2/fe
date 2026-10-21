import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

import { panel } from '../panel.css'

// 덩어리 사이 간격 — 높이 0인 긴급 고정 자리가 이만큼 끌어올려 간격을 상쇄한다.
const ROOT_GAP = spacing[20]

// 한 화면(1440×900 안팎)에 스크롤 없이 들어가게 줄 간격을 좁게 둔다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: ROOT_GAP,
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

// 긴급 띠가 스크롤로 사라지면 얇은 한 줄이 붙는 자리. 높이가 0이라 레이아웃이 바뀌지 않는다 —
// 띠 자체를 줄이면 브라우저의 스크롤 위치 보정(scroll anchoring)과 맞물려 붙었다 떨어졌다
// 깜빡인다.
export const urgentPin = style({
  position: 'sticky',
  // sticky는 스크롤 영역의 위쪽 여백(AdminLayout 본문 padding 40px)만큼 아래에 붙는다 —
  // 그만큼 끌어올려 헤더 바로 아래(8px)에 붙인다.
  top: `calc(${spacing[8]} - ${spacing[40]})`,
  height: 0,
  marginTop: `calc(-1 * ${ROOT_GAP})`,
  // 그래프 툴팁·표보다 위에 뜬다.
  zIndex: 10,
})

export const urgentPinned = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
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

export const taskPanel = panel
export { panelHeader, panelTitle } from '../panel.css'

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
