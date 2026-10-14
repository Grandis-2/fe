import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[40],
  width: '100%',
  maxWidth: '1000px',
})

// fieldset은 기본 테두리·여백이 있어 지운다 — 잠금(disabled)만 빌려 쓴다.
const fieldsetReset = {
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
} as const

/** 섹션들을 감싸는 fieldset. 잠기면 안의 입력을 한꺼번에 막고, 간격은 root와 같다 */
export const sections = style({
  ...fieldsetReset,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[40],
})

/** 칸 하나만 감싸 막을 때 — 모양은 그대로 둔다 */
export const plainFieldset = style(fieldsetReset)

/** 섹션 내용을 감싸는 흰 카드 */
export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  padding: spacing[20],
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
})

export const checkboxRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[10],
  cursor: 'pointer',
})

export const checkboxTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const checkboxLabel = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

export const hint = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])

export const period = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const periodTitle = style([
  typography.body.defaultMedium,
  { color: color.text.primary },
])

/*
 * 버튼 줄은 스크롤해도 화면 아래에 붙어 있다 — 폼이 길어서 저장하려고 끝까지 내려가야
 * 했다. 스크롤은 관리자 레이아웃의 내용 영역이 하므로 그 아래 끝에 붙는다. 폼 끝에
 * 닿으면 원래 자리에 놓인다. 아래로 지나가는 칸이 비치지 않게 페이지와 같은 배경을 깐다.
 */
// 관리자 레이아웃 내용 영역의 아래 여백(AdminLayout.css.ts의 content padding). sticky는
// 그 여백 위에 붙어서, 그만큼 내려 화면 끝까지 덮지 않으면 아래 칸이 틈으로 비친다.
const LAYOUT_BOTTOM_PADDING = spacing[40]

export const footer = style({
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
export const footerMessage = style([
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

export const footerIcon = style({
  width: '16px',
  height: '16px',
  flexShrink: 0,
})

export const footerLink = style([
  typography.body.subMedium,
  {
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: color.status.danger,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
])

export const variants = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const footerRight = style({
  display: 'flex',
  gap: spacing[8],
})
