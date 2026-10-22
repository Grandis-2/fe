import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 상품 관리(AdminProductsPage.css.ts)와 같은 배치·글씨 규칙.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[16],
})

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const title = style([
  typography.title.xlSemibold,
  { margin: 0, color: color.text.primary },
])

// 알림 문장 오른쪽 끝에 '확인하기'
export const notice = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
})

// 탭 이름 옆에 그 상태의 사전예약 수를 붙인다.
export const tabLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[6],
})

export const tabCount = style({
  fontVariantNumeric: 'tabular-nums',
  opacity: 0.8,
})

export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[12],
})

export const searchField = style({ flex: '2 1 260px', minWidth: 0 })

export const field = style({ flex: '1 1 180px', minWidth: 0 })

export const promotion = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  minWidth: 0,
})

export const thumbnail = style({
  flexShrink: 0,
  width: '56px',
  height: '56px',
  borderRadius: '8px',
  objectFit: 'cover',
  background: color.background.subSurface,
})

export const stacked = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const products = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[4],
  maxWidth: '280px',
})

export const product = style([
  typography.body.subMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[6],
    padding: `${spacing[2]} ${spacing[8]}`,
    borderRadius: '6px',
    background: color.background.surface,
    color: color.text.primary,
    whiteSpace: 'nowrap',
  },
])

export const productMode = style([
  typography.body.caption,
  { color: color.status.danger },
])

// 표 글씨는 공통 Table 기본(14)보다 한 단계 크게 — 상품 관리와 같다.
export const mainText = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const number = style([
  typography.body.defaultRegular,
  { color: color.text.primary, fontVariantNumeric: 'tabular-nums' },
])

export const subText = style([
  typography.body.sub,
  { color: color.text.secondary, fontVariantNumeric: 'tabular-nums' },
])

export const warnText = style([
  typography.body.subSemibold,
  { color: color.status.danger },
])
