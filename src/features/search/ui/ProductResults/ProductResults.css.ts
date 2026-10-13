import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: spacing[12],
  // 좁은 화면에선 180px 기준이면 한 줄에 하나라 카드가 너무 커진다 — 두 개씩 둔다.
  '@media': {
    [breakpoint.mobile]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
})

// 상품명에서 검색어와 겹치는 부분.
export const match = style({
  color: color.primary.subtle,
  fontWeight: 'inherit',
})

// 0건 안내 바로 아래라 다른 섹션 제목(12px)보다 크게 둬서 추천으로 눈이 이어지게 한다.
export const fallbackTitle = style([
  typography.title.smMedium,
  { margin: 0, color: color.text.inverse },
])
