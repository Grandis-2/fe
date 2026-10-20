import { style } from '@vanilla-extract/css'

import { breakpoint, color, onDark, spacing } from '@shared/config/theme'
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  width: '100%',
  boxSizing: 'border-box',
  alignItems: 'center',
  gap: '18px',
  padding: `${spacing[14]} ${spacing[16]} ${spacing[14]} ${spacing[14]}`,
  borderRadius: '16px',
  background: color.backgroundDark.surface,
  border: `1px solid ${onDark(10)}`,
  color: color.text.inverse,
  fontFamily: fontFamily.pretendard,
  lineHeight: lineHeight[140],
  '@media': {
    [breakpoint.mobile]: {
      gap: spacing[12],
      padding: spacing[12],
      borderRadius: '14px',
    },
  },
})

export const thumbnail = style({
  flexShrink: 0,
  width: '80px',
  height: '80px',
  borderRadius: '12px',
  overflow: 'hidden',
  background: onDark(8),
  '@media': {
    [breakpoint.mobile]: {
      width: '64px',
      height: '64px',
      borderRadius: '10px',
    },
  },
})

export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
})

export const body = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
})

// 모델끼리 이름 끝(Pro/Pro Max 등)으로 갈려서 자르지 않고 줄을 바꿔 다 보인다.
export const name = style({
  fontSize: fontSize[18],
  fontWeight: fontWeight.bold,
  wordBreak: 'keep-all',
  overflowWrap: 'anywhere',
  '@media': { [breakpoint.mobile]: { fontSize: fontSize[16] } },
})

export const caption = style({
  fontSize: fontSize[14],
  color: onDark(64),
  '@media': { [breakpoint.mobile]: { fontSize: fontSize[12] } },
})

export const price = style({
  fontSize: fontSize[16],
  fontWeight: fontWeight.bold,
  '@media': { [breakpoint.mobile]: { fontSize: fontSize[14] } },
})

export const priceUnit = style({
  fontSize: fontSize[12],
  fontWeight: fontWeight.regular,
  color: onDark(64),
})
