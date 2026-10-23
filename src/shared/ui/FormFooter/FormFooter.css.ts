import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 관리자 레이아웃 내용 영역의 아래 여백(AdminLayout.css.ts의 content padding). sticky는
// 그 여백 위에 붙어서, 그만큼 내려 화면 끝까지 덮지 않으면 아래 칸이 틈으로 비친다.
const LAYOUT_BOTTOM_PADDING = spacing[40]

/*
 * 스크롤은 관리자 레이아웃의 내용 영역이 하므로 그 아래 끝에 붙는다. 폼 끝에 닿으면 원래
 * 자리에 놓인다. 아래로 지나가는 칸이 비치지 않게 페이지와 같은 배경을 깐다.
 */
export const root = style({
  position: 'sticky',
  bottom: `calc(-1 * ${LAYOUT_BOTTOM_PADDING})`,
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
  padding: `${spacing[16]} 0 ${spacing[24]}`,
  marginBottom: `calc(-1 * ${LAYOUT_BOTTOM_PADDING})`,
  background: color.background.surface,
  borderTop: `1px solid ${color.border.default}`,
})

// 버튼 사이에서 남는 폭을 쓰는 결과 문구 — 오류가 없으면 비어 있다.
export const message = style([
  typography.body.sub,
  {
    flex: '1 1 auto',
    display: 'flex',
    alignItems: 'center',
    gap: spacing[6],
    minWidth: 0,
    color: color.status.danger,
  },
])

export const actions = style({
  display: 'flex',
  gap: spacing[8],
})
