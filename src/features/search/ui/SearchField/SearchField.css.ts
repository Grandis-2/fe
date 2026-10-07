import { style } from '@vanilla-extract/css'

import { color, onDark, spacing, typography } from '@shared/config/theme'

import { label, roundButton } from '../search.css'

export const field = style({
  // flex: 1은 basis가 0이라 세로 flex(검색 결과 화면)에선 높이가 눌린다 — grow만 준다.
  flexGrow: 1,
  minWidth: 0,
  boxSizing: 'border-box',
  height: '52px',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[12],
  padding: `0 ${spacing[8]} 0 18px`,
  borderRadius: '26px',
  background: color.backgroundDark.surface,
  border: `1.5px solid ${color.primary.base}`,
})

export const icon = style({
  flexShrink: 0,
  width: '20px',
  height: '20px',
  color: label,
})

export const input = style([
  typography.body.defaultRegular,
  {
    flex: 1,
    minWidth: 0,
    height: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'inherit',
    selectors: {
      '&::placeholder': { color: onDark(45) },
      // 브라우저 기본 지우기(✕) 대신 아래 clear 버튼을 쓴다.
      '&::-webkit-search-cancel-button': { display: 'none' },
    },
  },
])

export const clear = style([
  roundButton,
  {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: onDark(12),
  },
])
