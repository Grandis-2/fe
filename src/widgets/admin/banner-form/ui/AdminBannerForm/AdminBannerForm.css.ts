import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[32],
  width: '100%',
  // 다른 관리자 폼과 같은 폭 — 화면을 다 쓰면 한 줄이 너무 길어진다.
  maxWidth: '1000px',
})

export const badges = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

export const counter = style([
  typography.body.caption,
  {
    alignSelf: 'flex-end',
    color: color.text.tertiary,
    fontVariantNumeric: 'tabular-nums',
  },
])

// 쓴 만큼 늘어나 스크롤 없이 다 보인다. 비어 있을 땐 100px로 시작한다.
export const autoGrow = style({
  fieldSizing: 'content',
  minHeight: '100px',
})

export const iconGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
  gap: spacing[8],
})

export const iconButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '44px',
  border: `1px solid ${color.border.default}`,
  borderRadius: '8px',
  background: color.background.base,
  color: color.text.secondary,
  cursor: 'pointer',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { borderColor: color.border.hover },
  },
})

export const selected = style({
  borderColor: color.primary.base,
  background: color.primary.subtler,
  color: color.primary.base,
})

// 대체 문구 칸을 사진 칸 폭(ImageUploader의 banner 타일 maxWidth)에 맞춘다.
export const imageRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  maxWidth: '480px',
})

export const targetList = style({
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '320px',
  overflowY: 'auto',
  marginTop: spacing[8],
  padding: spacing[8],
  border: `1px solid ${color.border.default}`,
  borderRadius: '12px',
  background: color.background.base,
})

export const targetItem = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    padding: `${spacing[8]} ${spacing[12]}`,
    borderRadius: '8px',
    color: color.text.primary,
    cursor: 'pointer',
    selectors: {
      '&:hover': { background: color.background.surface },
    },
  },
])

export const targetItemTaken = style({
  color: color.text.disabled,
  cursor: 'not-allowed',
  selectors: {
    '&:hover': { background: 'transparent' },
  },
})

export const takenNote = style([
  typography.body.caption,
  { marginLeft: 'auto', color: color.text.tertiary },
])

export const hint = style([
  typography.body.sub,
  { padding: spacing[12], color: color.text.tertiary },
])

export const toggleRow = style([
  typography.body.defaultRegular,
  {
    display: 'inline-flex',
    // 섹션 본문이 세로 flex라 그냥 두면 줄 끝까지 늘어나 빈 곳을 눌러도 켜지고 꺼진다.
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: spacing[12],
    color: color.text.primary,
    cursor: 'pointer',
  },
])
