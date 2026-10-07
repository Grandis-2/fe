import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

const divider = `1px solid ${color.border.subtle}`
const padX = {
  paddingInline: spacing[24],
  '@media': { [breakpoint.mobile]: { paddingInline: spacing[20] } },
}

// 수정 중인 카드는 남색 테두리로 보기 카드(AddressCard)와 구분한다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '20px',
  border: `1px solid color-mix(in srgb, ${color.primary.subtle} 32%, transparent)`,
  background: color.background.base,
})

export const header = style([
  padX,
  typography.body.defaultMedium,
  { paddingBlock: '18px', borderBottom: divider, fontWeight: fontWeight.bold },
])

export const body = style([
  padX,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[16],
    paddingBlock: spacing[24],
  },
])

// 저장하기가 더 넓다 — 누를 버튼이 먼저 눈에 걸린다.
export const footer = style([
  padX,
  {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
    gap: spacing[8],
    paddingBlock: '18px',
    borderTop: divider,
    background: color.background.page,
  },
])
