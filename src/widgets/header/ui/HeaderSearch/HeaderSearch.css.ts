import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

import { onDark } from '../Header.css'

// 데스크톱에서 검색 아이콘을 누르면 이 입력창으로 바뀐다.
export const searchForm = style({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'center',
  gap: spacing[8],
  boxSizing: 'border-box',
  width: '300px',
  padding: `${spacing[8]} ${spacing[16]}`,
  borderRadius: '999px',
  border: `1px solid ${color.border.default}`,
  background: color.background.surface,
  color: color.text.tertiary,
  selectors: {
    [`${onDark} &`]: {
      borderColor: 'rgba(255, 255, 255, 0.2)',
      background: color.backgroundDark.surface,
    },
  },
})

export const searchIcon = style({
  flexShrink: 0,
  width: '20px',
  height: '20px',
  color: color.text.secondary,
  selectors: {
    [`${onDark} &`]: { color: color.text.inverse },
  },
})

export const searchInput = style([
  typography.body.sub,
  {
    flex: 1,
    minWidth: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: color.text.primary,
    selectors: {
      '&::placeholder': { color: color.text.tertiary },
      [`${onDark} &`]: { color: color.text.inverse },
    },
  },
])
