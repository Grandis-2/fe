import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

import {
  card as panel,
  head as panelHead,
  title as panelTitle,
} from '../panel.css'

export const card = panel
export const head = panelHead
export const title = panelTitle

export const caption = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

// 접수 [≤ / >] 외부 등록 처리 — 좁으면 줄을 바꾼다.
export const metrics = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'stretch',
  gap: spacing[12],
})

export const metric = style({
  flex: '1 1 140px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
  padding: `${spacing[12]} ${spacing[14]}`,
  borderRadius: '10px',
  background: color.background.surface,
})

export const metricLabel = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const metricValue = style([
  typography.title.xlSemibold,
  {
    fontWeight: fontWeight.bold,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const metricPending = style([
  typography.title.mdMedium,
  { color: color.text.secondary },
])

export const metricNote = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const metricNoteWarn = style([
  typography.body.subSemibold,
  { color: color.text.primary },
])

// 접수와 처리 사이 비교 기호 — 따라가면 초록, 밀리면 주황, 판단 전이면 회색.
const vsBase = style([
  typography.title.xlSemibold,
  { display: 'grid', placeItems: 'center', fontWeight: fontWeight.bold },
])

export const vs = styleVariants({
  following: [vsBase, { color: color.status.success }],
  congested: [vsBase, { color: color.status.warning }],
  pending: [vsBase, { color: color.text.tertiary }],
})

// 지금 값 · 바꿀 값 · 적용을 한 줄에 — 좁으면 줄을 바꾼다.
export const control = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[16],
  paddingTop: spacing[16],
  borderTop: `1px solid ${color.border.subtle}`,
})

export const current = style({
  flex: '1 1 160px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: spacing[2],
})

// 숫자 옆에 기본값·운영값 태그를 붙인다.
export const currentRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
})

export const currentValue = style([
  typography.title.xlSemibold,
  {
    fontWeight: fontWeight.bold,
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

// 설정보다 적게 들어갈 때 설정 줄 아래에 붙는 한 줄 — 서버 증설 대기·브레이크.
export const shortfall = style([
  typography.body.subSemibold,
  { color: color.text.primary },
])

export const unit = style([
  typography.body.defaultRegular,
  { marginLeft: spacing[2], color: color.text.secondary },
])

// 버튼을 입력 칸(small: 46px · 둥글기 8px)과 같은 높이로 맞춰 한 덩어리로 보이게 한다. 오류
// 문구가 칸 아래에 붙어도 버튼이 따라 내려가지 않게 위로 맞춘다.
export const stepper = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[4],
})

export const stepInput = style({ width: '120px' })

const previewBase = style([
  typography.title.mdMedium,
  { fontWeight: fontWeight.regular },
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
    padding: `${spacing[10]} ${spacing[14]}`,
    borderRadius: '10px',
    color: color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

// 권장 상한 안·대기가 풀리면 초록, 확인이 필요하면 주황, 용량을 모르면 무채색.
export const preview = styleVariants({
  success: [previewBase, { background: color.background.subtleSuccess }],
  warning: [previewBase, { background: color.background.subtleWarning }],
  danger: [previewBase, { background: color.background.subtleDanger }],
  muted: [previewBase, { background: color.background.surface }],
})

export const previewValue = style({ fontWeight: fontWeight.semibold })

export const previewSub = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

export const foot = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

// 입장을 멈추는 동작 — 적용과 떨어뜨리고, 빨간 테두리로 위험하다는 걸 먼저 보인다.
export const stopButton = style({
  borderColor: color.status.danger,
  color: color.status.danger,
  selectors: {
    '&:hover:not(:disabled)': { background: color.background.subtleDanger },
  },
})
