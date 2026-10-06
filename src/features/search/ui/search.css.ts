import { style } from '@vanilla-extract/css'

import { onDark, spacing, typography } from '@shared/config/theme'

// 검색창·검색 결과가 같이 쓰는 스타일. 테마와 상관없이 어두운 화면이다(디자인 기준) —
// 글자·선은 onDark로 흰색 투명도만 바꾼다.
export const label = onDark(64)
export const divider = `1px solid ${onDark(8)}`
export const chipBorder = `1px solid ${onDark(18)}`
export const cardBorder = `1px solid ${onDark(10)}`

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
})

export const sectionTitle = style([
  typography.body.captionMedium,
  { margin: 0, color: label },
])

export const list = style({ margin: 0, padding: 0, listStyle: 'none' })

export const roundButton = style({
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
})

export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
})
