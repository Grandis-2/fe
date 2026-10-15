import { style } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
})

export const addRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
  maxWidth: '420px',
})

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  gap: spacing[8],
})

export const groupTitle = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const tags = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

/** 접힌 목록을 여는 줄 — 태그가 아니라 조작이라 칩 모양을 쓰지 않는다 */
export const moreButton = style([
  typography.body.subMedium,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[6],
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: color.primary.base,
    cursor: 'pointer',
  },
])

export const chevron = style({
  width: '16px',
  height: '16px',
  transition: `transform ${motion.duration.fast} ${motion.easing.default}`,
})

export const chevronUp = style([chevron, { transform: 'rotate(180deg)' }])

/**
 * Tag는 span이라 누를 수 없어 버튼으로 감싼다 — 껍데기라 생김새는 전부 안의 Tag가
 * 가진다. 포커스 링이 알약 모양을 따라가게 radius만 맞춰 둔다.
 */
export const tagButton = style({
  display: 'inline-flex',
  padding: 0,
  border: 'none',
  borderRadius: '9999px',
  background: 'transparent',
  cursor: 'pointer',
})

/** 껍데기가 hover를 받으니 표시는 안쪽 Tag가 한다 */
export const tag = style({
  transition: `opacity ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    [`${tagButton}:hover &`]: { opacity: 0.75 },
  },
})
