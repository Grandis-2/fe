import { style } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  // gap: spacing[20],
  width: '100%',

  boxSizing: 'border-box',
  borderRadius: '16px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
})

export const title = style({
  color: color.text.primary,
  padding: `${spacing[24]} ${spacing[16]}`,
})

export const rows = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  padding: `0 ${spacing[16]} ${spacing[24]} ${spacing[16]}`,
})

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[12],
})

export const rowLabel = style({ color: color.text.secondary })
export const rowValue = style({ color: color.text.primary })
// 어두운 화면에서 primary.base는 버튼 바탕용이라 글자로는 흐리다 — 강조 글자는 subtle을 쓴다
// (semantic.css.ts 다크 토큰 주석). 장바구니는 아직 밝은 화면이라 다크일 때만 바꾼다.
const darkHighlight = {
  selectors: { '[data-theme="dark"] &': { color: color.primary.subtle } },
}

export const rowValueHighlight = style({
  color: color.primary.base,
  ...darkHighlight,
})

export const totalRow = style([
  row,
  {
    padding: `${spacing[16]} ${spacing[20]}`,

    background: color.primary.surface,
    color: color.primary.base,
    selectors: {
      // 다크의 primary.surface는 카드 바탕과 거의 같아 묻힌다 — 반투명 남색을 얹어 띄운다(Checkout.dc.html).
      '[data-theme="dark"] &': {
        background: `color-mix(in srgb, ${color.primary.subtle} 12%, transparent)`,
        color: color.primary.subtle,
      },
    },
  },
])

// export const totalValue = style({ color: color.primary.focus })

export const actionRow = style({ padding: spacing[16] })

export const action = style({ width: '100%' })
