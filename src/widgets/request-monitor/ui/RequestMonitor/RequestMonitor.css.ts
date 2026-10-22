import { style, styleVariants } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  onDark,
  shadow,
  spacing,
  statusOnDark,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
  typography,
} from '@shared/config/theme'

const tint = (base: string, percent: number) =>
  `color-mix(in srgb, ${base} ${percent}%, transparent)`

// 화면 왼쪽 아래에 떠 있는 창 — 관리자(밝은)·구매자(어두운) 화면 어디서든 읽히게 늘 어두운 유리 바탕이다.
// popover로 띄워 top layer에 올린다 — 모달(<dialog>)이 열려도 그 위에 보이게.
// popover의 UA 기본값(가운데 정렬·테두리·여백)은 지운다.
export const root = style({
  position: 'fixed',
  inset: 'auto',
  left: spacing[16],
  bottom: `calc(${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET} + ${spacing[8]})`,
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'none',
  overflow: 'visible',
  color: onDark(92),
  '@media': {
    [breakpoint.desktop]: { bottom: spacing[16] },
  },
})

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  width: `min(420px, calc(100vw - ${spacing[32]}))`,
  maxHeight: 'min(560px, 70vh)',
  padding: spacing[14],
  boxSizing: 'border-box',
  border: `1px solid ${onDark(12)}`,
  borderRadius: '16px',
  background: tint(color.backgroundDark.base, 88),
  backdropFilter: 'blur(18px) saturate(140%)',
  boxShadow: shadow.mdDark,
  // 기록 목록의 스크롤바도 어두운 바탕에 맞춘다.
  colorScheme: 'dark',
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
})

export const title = style([
  typography.body.subSemibold,
  { flex: 1, display: 'flex', alignItems: 'center', gap: spacing[8] },
])

export const liveDot = style({
  width: spacing[8],
  height: spacing[8],
  borderRadius: '50%',
  background: statusOnDark.success,
  boxShadow: `0 0 8px ${statusOnDark.success}`,
})

export const textButton = style([
  typography.body.captionMedium,
  {
    padding: `${spacing[4]} ${spacing[8]}`,
    border: `1px solid ${onDark(14)}`,
    borderRadius: '999px',
    background: 'none',
    color: onDark(78),
    cursor: 'pointer',
    selectors: {
      '&:hover': { color: onDark(96), borderColor: onDark(30) },
      '&:focus-visible': { outline: `2px solid ${color.primary.subtle}` },
    },
  },
])

export const policy = style([typography.body.caption, { color: onDark(60) }])

export const faultRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[6],
})

export const faultLabel = style([
  typography.body.captionMedium,
  { color: onDark(60), marginRight: spacing[2] },
])

const faultBase = style([
  typography.body.captionMedium,
  {
    padding: `${spacing[4]} ${spacing[10]}`,
    border: '1px solid',
    borderRadius: '999px',
    cursor: 'pointer',
    selectors: {
      '&:focus-visible': { outline: `2px solid ${color.primary.subtle}` },
    },
  },
])

export const faultButton = styleVariants({
  off: [
    faultBase,
    { borderColor: onDark(14), background: 'none', color: onDark(70) },
  ],
  // 장애 없음을 고른 상태 — 빨강은 장애를 건 버튼에만 쓴다.
  selected: [
    faultBase,
    { borderColor: onDark(40), background: onDark(12), color: onDark(96) },
  ],
  on: [
    faultBase,
    {
      borderColor: tint(statusOnDark.danger, 60),
      background: tint(color.status.danger, 30),
      color: onDark(96),
    },
  ],
})

// 최근 WINDOW_MS를 한 줄로 그린다 — 점은 요청, 주황 막대는 실패 뒤 일부러 기다린 시간.
export const timeline = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const track = style({
  position: 'relative',
  height: spacing[24],
  borderRadius: spacing[6],
  background: onDark(5),
  overflow: 'hidden',
})

export const waitBar = style({
  position: 'absolute',
  top: spacing[8],
  height: spacing[8],
  borderRadius: spacing[4],
  background: tint(statusOnDark.warning, 55),
})

const dotBase = style({
  position: 'absolute',
  top: '50%',
  width: spacing[10],
  height: spacing[10],
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  boxSizing: 'border-box',
})

export const dot = styleVariants({
  ok: [dotBase, { background: statusOnDark.success }],
  fail: [dotBase, { background: statusOnDark.danger }],
  pending: [dotBase, { border: `2px solid ${onDark(80)}` }],
  canceled: [dotBase, { border: `2px solid ${onDark(35)}` }],
})

export const axis = style([
  typography.body.caption,
  {
    display: 'flex',
    justifyContent: 'space-between',
    color: onDark(45),
    fontVariantNumeric: 'tabular-nums',
  },
])

export const countdown = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  padding: spacing[10],
  borderRadius: spacing[10],
  background: tint(color.status.warning, 14),
})

export const countdownText = style([
  typography.body.subMedium,
  { color: onDark(92), fontVariantNumeric: 'tabular-nums' },
])

export const countdownTrack = style({
  height: spacing[4],
  borderRadius: spacing[2],
  background: onDark(10),
  overflow: 'hidden',
})

export const countdownFill = style({
  height: '100%',
  background: statusOnDark.warning,
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  margin: 0,
  padding: 0,
  listStyle: 'none',
  overflowY: 'auto',
})

export const row = style({
  display: 'grid',
  gridTemplateColumns: '64px 1fr',
  gap: `${spacing[2]} ${spacing[8]}`,
  padding: `${spacing[8]} 0`,
  borderTop: `1px solid ${onDark(8)}`,
  selectors: { '&:first-child': { borderTop: 'none' } },
})

export const time = style([
  typography.body.caption,
  { color: onDark(45), fontVariantNumeric: 'tabular-nums', paddingTop: '1px' },
])

export const line = style([
  typography.body.captionMedium,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: `${spacing[2]} ${spacing[6]}`,
    minWidth: 0,
    color: onDark(88),
  },
])

export const path = style({ overflowWrap: 'anywhere' })

export const method = style({ color: onDark(50) })

// 어느 흐름의 요청인지(대기열·사전예약·결제·알림).
export const topic = style([
  typography.body.caption,
  {
    padding: `0 ${spacing[6]}`,
    borderRadius: '999px',
    border: `1px solid ${onDark(24)}`,
    color: onDark(75),
  },
])

export const status = styleVariants({
  ok: { color: statusOnDark.success },
  fail: { color: statusOnDark.danger },
  pending: { color: onDark(60) },
  canceled: { color: onDark(45) },
  wait: { color: statusOnDark.warning },
})

export const tag = style([
  typography.body.caption,
  {
    padding: `0 ${spacing[6]}`,
    borderRadius: '999px',
    background: tint(color.primary.base, 45),
    color: onDark(92),
  },
])

export const detail = style([
  typography.body.caption,
  {
    gridColumn: 2,
    color: onDark(55),
    fontVariantNumeric: 'tabular-nums',
  },
])

export const empty = style([
  typography.body.caption,
  { color: onDark(45), padding: `${spacing[8]} 0` },
])

// 접었을 때 — 왼쪽 아래의 작은 알약.
export const pill = style([
  typography.body.captionMedium,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    padding: `${spacing[8]} ${spacing[14]}`,
    border: `1px solid ${onDark(14)}`,
    borderRadius: '999px',
    background: tint(color.backgroundDark.base, 88),
    backdropFilter: 'blur(18px) saturate(140%)',
    boxShadow: shadow.mdDark,
    color: onDark(88),
    cursor: 'pointer',
    selectors: {
      '&:focus-visible': { outline: `2px solid ${color.primary.subtle}` },
    },
  },
])

export const failCount = style({ color: statusOnDark.danger })
