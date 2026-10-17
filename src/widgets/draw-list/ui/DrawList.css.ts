import { style } from '@vanilla-extract/css'

import { breakpoint, color, onDark, spacing } from '@shared/config/theme'
import {
  fontFamily,
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

// 어두운 럭키 드로우 페이지 전용 — 테마와 상관없이 흰 글자(onDark)를 쓴다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[32],
  color: color.text.inverse,
  fontFamily: fontFamily.pretendard,
  '@media': { [breakpoint.mobile]: { gap: spacing[20] } },
})

export const intro = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
})

export const overline = style({
  fontFamily: fontFamily.michroma,
  fontSize: fontSize[12],
  letterSpacing: '0.14em',
  color: color.primary.subtle,
})

export const title = style({
  margin: 0,
  fontSize: fontSize[32],
  fontWeight: fontWeight.bold,
  // 모바일은 헤더가 같은 제목을 띄운다(getMobileTitle).
  '@media': { [breakpoint.mobile]: { display: 'none' } },
})

export const description = style({
  fontSize: fontSize[16],
  color: onDark(64),
  '@media': { [breakpoint.mobile]: { fontSize: fontSize[14] } },
})

export const tabs = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

// 넓은 화면 4열, 중간 2열, 모바일 1열.
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: `${spacing[32]} ${spacing[20]}`,
  '@media': {
    '(max-width: 999px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    [breakpoint.mobile]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: spacing[24],
    },
  },
})
