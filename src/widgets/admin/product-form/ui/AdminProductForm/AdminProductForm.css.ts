import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  width: '100%',
  maxWidth: '1240px',
})

/** 등록 화면 — 섹션만 한 줄로 */
export const plain = style({ maxWidth: '1000px' })

/** 수정 화면 — 섹션 오른쪽에 목차가 붙는다. 좁으면 목차를 뺀다 */
export const withToc = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 220px',
  gap: spacing[24],
  alignItems: 'start',
  '@media': {
    '(max-width: 1100px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
})

export const toc = style({
  position: 'sticky',
  top: spacing[20],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  padding: spacing[12],
  borderRadius: '12px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  '@media': {
    '(max-width: 1100px)': { display: 'none' },
  },
})

export const tocTitle = style([
  typography.body.subSemibold,
  {
    padding: `${spacing[4]} ${spacing[10]} ${spacing[8]}`,
    color: color.text.tertiary,
  },
])

export const tocLink = style([
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

export const tocIcon = style({
  width: '14px',
  height: '14px',
  flexShrink: 0,
  color: color.text.tertiary,
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

/** 세로로 쌓는 칸 묶음을 막을 때 */
export const stack = style({
  ...fieldsetReset,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

/** 상품명 · 브랜드 · 모델명을 한 줄에 — 좁으면 내려간다 */
export const basicGrid = style({
  ...fieldsetReset,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: spacing[12],
  alignItems: 'start',
})

/** 보증 판매 켜기 — 글자와 스위치를 한 줄에 */
export const toggleRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
  padding: `${spacing[12]} ${spacing[16]}`,
  borderRadius: '12px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
  cursor: 'pointer',
})

/** 섹션 내용을 감싸는 흰 카드 */
export const card = style({
  ...fieldsetReset,
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

// 기본 가격 · 할인율을 한 줄에 — 좁으면 두 줄로 내려간다.
export const priceRow = style({
  ...fieldsetReset,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: spacing[12],
  alignItems: 'start',
})

export const variants = style({
  ...fieldsetReset,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

/** 저장하지 않은 변경 — 실패 문구가 아니라 회색으로 */
export const pending = style([
  typography.body.subMedium,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[6],
    color: color.text.secondary,
  },
])

export const footerRight = style({
  display: 'flex',
  gap: spacing[8],
})
