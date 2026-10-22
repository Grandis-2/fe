import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

// 예약 상세와 같은 틀 — 제목 줄엔 요약이 있어 마지막 갱신은 브레드크럼 줄 오른쪽에 둔다.
export const topBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spacing[8]} ${spacing[16]}`,
})

export const titleRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${spacing[12]} ${spacing[16]}`,
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

export const summary = style([
  typography.body.defaultRegular,
  { color: color.text.secondary },
])

// 왼쪽은 넓게 응모 현황, 오른쪽은 좁게 증정품·회차 정보. 좁으면 아래로 내려간다.
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

export const panelTitle = style([
  typography.title.mdSemibold,
  { margin: 0, color: color.text.primary },
])

export const note = style([
  typography.body.caption,
  { color: color.text.secondary },
])

// 응모 현황의 큰 숫자 셋 — 추첨 대상, 경쟁률, 당첨.
export const figures = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${spacing[12]} ${spacing[32]}`,
  margin: 0,
})

export const figure = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
})

export const figureLabel = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const figureValue = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const figureUnit = style([
  typography.body.defaultMedium,
  { color: color.text.secondary },
])

// 결제 완료·확인 중·대기를 한 막대에 — 진한 쪽이 추첨 대상이다.
export const bar = style({
  display: 'flex',
  height: '12px',
  borderRadius: '9999px',
  overflow: 'hidden',
  background: color.background.subSurface,
})

const swatch = {
  paid: color.primary.base,
  authorizing: color.primary.subtle,
  awaiting: color.border.hover,
}

export const segment = styleVariants(swatch, (background) => ({ background }))

export const legend = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${spacing[8]} ${spacing[20]}`,
    margin: 0,
    padding: 0,
    listStyle: 'none',
    color: color.text.secondary,
  },
])

export const legendItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[6],
})

export const legendTotal = style({ marginLeft: 'auto' })

export const legendDot = styleVariants(swatch, (background) => ({
  width: '10px',
  height: '10px',
  borderRadius: '3px',
  background,
}))

export const legendCount = style({
  color: color.text.primary,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
})

export const gift = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[14],
})

export const giftImage = style({
  flexShrink: 0,
  width: '64px',
  height: '64px',
  borderRadius: '10px',
  objectFit: 'cover',
  background: color.background.subSurface,
})

export const giftName = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const giftOption = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const list = style({
  display: 'grid',
  gridTemplateColumns: '88px minmax(0, 1fr)',
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

export const idValue = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[8],
})
