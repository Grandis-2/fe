import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 관리자 레이아웃 내용 영역의 위 여백(AdminLayout.css.ts의 content padding). sticky는 그
// 여백 아래에 붙어서, 그만큼 끌어올려야 스크롤 영역 맨 위 가까이에 붙는다.
const LAYOUT_TOP_PADDING = spacing[40]

const NARROW = '(max-width: 1100px)'

export const root = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 220px',
  gap: spacing[24],
  alignItems: 'start',
  '@media': { [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
})

export const toc = style({
  position: 'sticky',
  top: `calc(${spacing[20]} - ${LAYOUT_TOP_PADDING})`,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  padding: spacing[12],
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  '@media': { [NARROW]: { display: 'none' } },
})

export const title = style([
  typography.body.subSemibold,
  {
    padding: `${spacing[4]} ${spacing[10]} ${spacing[8]}`,
    color: color.text.tertiary,
  },
])

export const link = style([
  typography.body.sub,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
    padding: `${spacing[8]} ${spacing[10]}`,
    borderRadius: '8px',
    color: color.text.secondary,
    textDecoration: 'none',
    selectors: {
      '&:hover': {
        background: color.background.surface,
        color: color.text.primary,
      },
    },
  },
])
