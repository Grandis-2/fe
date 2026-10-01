import { style } from '@vanilla-extract/css'

import { color, spacing } from '@/shared/config/theme'
import { breakpoint } from '@/shared/config/theme/tokens/breakpoint'

// 데스크톱에선 2열 그리드 — 전체 선택 줄은 1행(왼쪽 칸)만 차지하고, 상품 목록과 리모컨이
// 나란히 2행에서 시작한다. 그래서 리모컨 윗변이 전체 선택 아래 구분선과 맞는다.
export const root = style({
  display: 'grid',
  rowGap: spacing[24],
  width: '100%',
  '@media': {
    [breakpoint.desktop]: {
      gridTemplateColumns: '1fr 270px',
      columnGap: spacing[24],
      alignItems: 'start',
    },
  },
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  minWidth: 0,
  '@media': {
    [breakpoint.desktop]: {
      gridColumn: 1,
      gridRow: 2,
    },
  },
})

// 데스크톱에서만 스크롤을 따라다닌다 — 모바일은 목록 아래에 그냥 붙는다.
export const remote = style({
  marginTop: spacing[12],
  '@media': {
    [breakpoint.desktop]: {
      gridColumn: 2,
      gridRow: 2,
      position: 'sticky',
      top: spacing[24],
      marginTop: 0,
    },
  },
})

// 카드 사이 구분선 — 위쪽 gap(24px)과 같은 값으로 패딩을 줘서 선이 가운데 놓인다.
export const card = style({
  selectors: {
    '&:not(:first-child)': {
      paddingTop: spacing[24],
      borderTop: `1px solid ${color.border.subtle}`,
    },
  },
})

// 구분선은 카드 목록과 폭을 맞춰야 해서(리모컨 위까지 가로지름) 줄 전체를 차지하지만,
// 클릭 영역(label)까지 늘어나면 안 되므로 선은 이 바깥 줄에, label은 안에서 내용만큼만.
export const selectAllRow = style({
  paddingBottom: spacing[12],
  borderBottom: `1px solid ${color.border.subtle}`,
  '@media': {
    [breakpoint.desktop]: {
      gridColumn: '1 / -1',
      gridRow: 1,
    },
  },
})

// 카드의 체크박스와 같은 x축에 오도록 좌측 여백 없이 두고, 내용(체크박스+글자)만큼만 차지한다.
export const selectAll = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[12],
  color: color.text.primary,
  cursor: 'pointer',
  userSelect: 'none',
})
