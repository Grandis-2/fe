import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

// 예약 현황·운영 대시보드와 같은 제목 줄 — 왼쪽 제목, 오른쪽 마지막 대조와 실행 버튼.
export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const runStatus = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[12],
    color: color.text.secondary,
  },
])

// 최근 검사 결과 카드 — 판정 태그 · 설명 · 오른쪽 끝 정기 검사 안내. 어긋남이 있으면 테두리를 붉힌다.
const summaryBase = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${spacing[12]} ${spacing[24]}`,
    padding: `${spacing[16]} ${spacing[20]}`,
    borderRadius: '12px',
    border: `1px solid ${color.border.default}`,
    background: color.background.base,
    color: color.text.secondary,
  },
])

export const summary = styleVariants({
  default: [summaryBase],
  alert: [summaryBase, { borderColor: color.status.danger }],
})

const summaryTagBase = style([
  typography.body.defaultMedium,
  {
    padding: `${spacing[4]} ${spacing[10]}`,
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
])

export const summaryTag = styleVariants({
  run: [
    summaryTagBase,
    { background: color.primary.subtler, color: color.primary.focus },
  ],
  ok: [
    summaryTagBase,
    { background: color.background.subtleSuccess, color: color.text.primary },
  ],
  fail: [
    summaryTagBase,
    { background: color.background.subtleDanger, color: color.status.danger },
  ],
})

export const summaryText = style({ flex: '1 1 320px', minWidth: 0 })

export const summaryAside = style([
  typography.body.sub,
  { marginLeft: 'auto', color: color.text.tertiary },
])

// 탭 이름 옆에 그 유형의 건수를 붙인다. 0건은 흐리게.
export const tabLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[6],
})

export const tabCount = style({
  fontVariantNumeric: 'tabular-nums',
  opacity: 0.8,
})

export const tabCountZero = style({
  fontVariantNumeric: 'tabular-nums',
  opacity: 0.4,
})

export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

export const field = style({ flex: '0 1 280px', minWidth: 0 })

// 고른 건수와 재처리 단추 — 예약 현황의 선택 바와 같다.
export const selectionBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
  padding: `${spacing[10]} ${spacing[16]}`,
  borderRadius: '10px',
  background: color.primary.subtler,
})

export const selectionCount = style([
  typography.body.defaultMedium,
  { color: color.primary.focus, fontVariantNumeric: 'tabular-nums' },
])

// 표 글씨는 예약 현황처럼 공통 Table 기본(14)보다 한 단계 크게 둔다.
export const stacked = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const mainText = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const cellText = style([
  typography.body.defaultRegular,
  { color: color.text.primary },
])

export const subText = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

// 우리/외부 두 줄을 이름 칸과 값 칸으로 맞춘다.
export const compare = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  columnGap: spacing[10],
  rowGap: spacing[2],
  alignItems: 'baseline',
})

export const side = style([
  typography.body.captionMedium,
  { color: color.text.tertiary },
])

export const sideValue = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const sideValueWrong = style([
  typography.body.subSemibold,
  { color: color.status.danger },
])

export const hint = style([
  typography.body.sub,
  { color: color.text.secondary, whiteSpace: 'nowrap' },
])

// 우리 예약이 있는 건만 상세로 간다 — 공통 Table의 행 끝 > 버튼과 같은 모양이다.
export const detailButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing[4],
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: [
    `background ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:hover': {
      background: color.background.subSurface,
      color: color.primary.base,
    },
  },
})

export const detailIcon = style({ width: '18px', height: '18px' })

// 서버 검사 코드 — 개발팀에 물을 때 그대로 읽게 작게 붙인다.
export const code = style([
  typography.body.caption,
  {
    color: color.text.tertiary,
    fontFamily: 'ui-monospace, Menlo, monospace',
  },
])

// 조치 뒤 상태 — 처리 중(브랜드색) · 완료(초록) · 실패(빨강).
export const stateWait = style([
  typography.body.subSemibold,
  { color: color.primary.base, whiteSpace: 'nowrap' },
])

export const stateOk = style([
  typography.body.subSemibold,
  { color: color.text.primary, whiteSpace: 'nowrap' },
])

export const stateFail = style([
  typography.body.subSemibold,
  { color: color.status.danger },
])

export const navigator = style({ alignSelf: 'center' })

export const actionButton = style({ whiteSpace: 'nowrap' })
