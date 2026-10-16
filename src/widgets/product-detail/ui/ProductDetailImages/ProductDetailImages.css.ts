import { style } from '@vanilla-extract/css'

import { breakpoint, color, typography } from '@shared/config/theme'

// 상세 사진은 세로로 긴 한 장짜리 안내문처럼 이어 보이게 틈 없이 붙인다.
export const images = style({
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '20px',
  overflow: 'hidden',
})

export const image = style({
  display: 'block',
  width: '100%',
  height: 'auto',
})

export const empty = style([
  typography.body.defaultRegular,
  {
    display: 'grid',
    placeItems: 'center',
    height: '320px',
    borderRadius: '20px',
    background: color.background.base,
    border: `1px solid ${color.border.subtle}`,
    color: color.text.tertiary,
    '@media': { [breakpoint.mobile]: { height: '200px' } },
  },
])
