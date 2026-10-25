import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

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

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
  minWidth: 0,
})

export const titleLine = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[10],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

// 무슨 이벤트가 어느 예약에서 얼마나 멈췄는지 — 제목 아래 한 줄.
export const summary = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${spacing[4]} ${spacing[12]}`,
    color: color.text.secondary,
  },
])

export const code = style({ fontFamily: mono, fontSize: '13px' })

// 상태 태그와 떨어뜨려, 조치 버튼임을 드러낸다.
export const actions = style({
  display: 'flex',
  gap: spacing[8],
  marginLeft: 'auto',
})

// 왼쪽은 넓게 원문, 오른쪽은 좁게 참고 정보. 좁으면 아래로 내려간다.
export const columns = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[16],
  alignItems: 'flex-start',
})

export const main = style({ flex: '2 1 560px' })

export const side = style({
  flex: '1 1 340px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const titleNote = style([
  typography.body.subMedium,
  { color: color.text.secondary },
])

export const note = style([typography.body.sub, { color: color.text.tertiary }])

export const muted = style({ color: color.text.tertiary })

export const link = style({
  color: color.primary.base,
  textDecoration: 'underline',
  fontVariantNumeric: 'tabular-nums',
})

export const trace = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
})

export const traceRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[10],
  padding: `${spacing[10]} 0`,
  borderBottom: `1px solid ${color.border.subtle}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
})

export const traceLabel = style([
  typography.body.sub,
  { width: '96px', flexShrink: 0, color: color.text.secondary },
])

export const traceValue = style({
  flex: 1,
  minWidth: 0,
  fontFamily: mono,
  fontSize: '13px',
  color: color.text.primary,
  overflowWrap: 'anywhere',
})

export const history = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
})

export const historyRow = style([
  typography.body.sub,
  {
    display: 'grid',
    gridTemplateColumns: '128px minmax(0, 1fr)',
    gap: spacing[12],
    color: color.text.primary,
  },
])

export const historyAt = style({
  color: color.text.secondary,
  fontVariantNumeric: 'tabular-nums',
})
