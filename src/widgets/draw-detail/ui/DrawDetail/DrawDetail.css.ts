import { style, styleVariants } from '@vanilla-extract/css'

import { breakpoint, color, onDark, spacing } from '@shared/config/theme'
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} from '@shared/config/theme/tokens/typography/base'

// 어두운 럭키 드로우 페이지 전용 — 테마와 상관없이 흰 글자(onDark)를 쓴다.
const mobile = breakpoint.mobile

const surface = `color-mix(in srgb, ${color.backgroundDark.surface} 80%, transparent)`

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '96px',
  color: color.text.inverse,
  fontFamily: fontFamily.pretendard,
  lineHeight: lineHeight[140],
  '@media': { [mobile]: { gap: '56px' } },
})

// 웹은 이미지와 정보를 반반, 모바일은 위아래로 쌓는다.
export const hero = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '56px',
  alignItems: 'start',
  '@media': {
    [mobile]: { gridTemplateColumns: 'minmax(0, 1fr)', gap: spacing[24] },
  },
})

export const imageBox = style({
  position: 'relative',
  aspectRatio: '1',
  borderRadius: '24px',
  overflow: 'hidden',
  background: color.backgroundDark.surface,
  border: `1px solid ${onDark(10)}`,
  '@media': { [mobile]: { borderRadius: '20px' } },
})

export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
})

export const imageTag = style({
  position: 'absolute',
  top: spacing[20],
  left: spacing[20],
  padding: `${spacing[6]} ${spacing[12]}`,
  borderRadius: '8px',
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(8px)',
  fontFamily: fontFamily.michroma,
  fontSize: fontSize[12],
  letterSpacing: '0.12em',
  color: color.primary.subtle,
  '@media': { [mobile]: { top: spacing[14], left: spacing[14] } },
})

export const info = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
})

export const head = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const badges = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[8],
})

export const badge = style({
  padding: `${spacing[4]} ${spacing[10]}`,
  borderRadius: '6px',
  background: `color-mix(in srgb, ${color.primary.subtle} 16%, transparent)`,
  color: color.primary.subtle,
  fontSize: fontSize[12],
  fontWeight: fontWeight.semibold,
})

export const option = style({
  fontSize: fontSize[14],
  color: onDark(55),
})

export const title = style({
  margin: 0,
  fontSize: fontSize[32],
  fontWeight: fontWeight.bold,
  lineHeight: 1.3,
  letterSpacing: '-0.01em',
  textWrap: 'pretty',
  '@media': { [mobile]: { fontSize: fontSize[24] } },
})

export const description = style({
  fontSize: fontSize[16],
  lineHeight: 1.6,
  color: onDark(64),
  textWrap: 'pretty',
  '@media': { [mobile]: { fontSize: fontSize[14] } },
})

export const fee = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing[6],
  marginTop: spacing[4],
})

export const feeLabel = style({
  marginRight: spacing[4],
  fontSize: fontSize[14],
  color: onDark(55),
})

export const feeValue = style({
  fontSize: '28px',
  fontWeight: fontWeight.bold,
  fontVariantNumeric: 'tabular-nums',
})

export const feeUnit = style({ fontSize: fontSize[16], color: onDark(64) })

export const countdown = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  padding: `${spacing[20]} ${spacing[24]}`,
  borderRadius: '18px',
  background: surface,
  border: `1px solid ${onDark(10)}`,
  '@media': { [mobile]: { padding: spacing[16], borderRadius: '14px' } },
})

export const countdownLabel = style({
  fontSize: fontSize[14],
  fontWeight: fontWeight.semibold,
  color: onDark(55),
})

export const countdownParts = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing[8],
  fontVariantNumeric: 'tabular-nums',
})

export const countdownPart = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing[4],
})

export const countdownValue = styleVariants({
  live: {
    fontSize: '34px',
    fontWeight: fontWeight.bold,
    '@media': { [mobile]: { fontSize: fontSize[24] } },
  },
  over: {
    fontSize: '34px',
    fontWeight: fontWeight.bold,
    color: onDark(55),
    '@media': { [mobile]: { fontSize: fontSize[24] } },
  },
})

export const countdownUnit = style({
  marginRight: spacing[10],
  fontSize: fontSize[14],
  color: onDark(55),
})

export const rows = style({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
})

export const row = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: spacing[16],
  padding: `${spacing[14]} 0`,
  borderBottom: `1px solid ${onDark(8)}`,
  fontSize: fontSize[16],
  '@media': { [mobile]: { fontSize: fontSize[14] } },
})

export const rowLabel = style({ margin: 0, color: onDark(55) })

export const rowValue = style({
  margin: 0,
  color: onDark(90),
  textAlign: 'right',
})

const noteBase = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  padding: `18px ${spacing[20]}`,
  borderRadius: '16px',
})

export const note = styleVariants({
  highlight: [
    noteBase,
    {
      background: `color-mix(in srgb, ${color.primary.base} 18%, transparent)`,
      border: `1px solid ${color.primary.base}`,
    },
  ],
  info: [
    noteBase,
    {
      background: `color-mix(in srgb, ${color.primary.subtle} 8%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color.primary.subtle} 30%, transparent)`,
    },
  ],
  muted: [noteBase, { background: surface, border: `1px solid ${onDark(10)}` }],
})

export const noteTitle = style({
  fontSize: fontSize[16],
  fontWeight: fontWeight.bold,
})

export const noteBody = style({
  fontSize: fontSize[14],
  lineHeight: 1.6,
  color: onDark(64),
  textWrap: 'pretty',
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  '@media': { [mobile]: { gap: spacing[14] } },
})

export const sectionTitle = style({
  margin: 0,
  fontSize: fontSize[24],
  fontWeight: fontWeight.bold,
  '@media': { [mobile]: { fontSize: fontSize[18] } },
})

const list = style({ margin: 0, padding: 0, listStyle: 'none' })

export const steps = style([
  list,
  {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: spacing[16],
    '@media': {
      [mobile]: { gridTemplateColumns: 'minmax(0, 1fr)', gap: spacing[10] },
    },
  },
])

export const step = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  padding: spacing[24],
  borderRadius: '18px',
  background: surface,
  border: `1px solid ${onDark(10)}`,
  '@media': { [mobile]: { padding: spacing[20], borderRadius: '14px' } },
})

export const stepNumber = style({
  fontFamily: fontFamily.michroma,
  fontSize: fontSize[12],
  letterSpacing: '0.08em',
  color: color.primary.subtle,
})

export const stepTitle = style({
  fontSize: fontSize[18],
  fontWeight: fontWeight.bold,
})

export const stepDescription = style({
  fontSize: fontSize[14],
  lineHeight: 1.6,
  color: onDark(64),
  textWrap: 'pretty',
})

export const others = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: spacing[20],
  '@media': {
    '(max-width: 999px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    [mobile]: { gridTemplateColumns: 'minmax(0, 1fr)', gap: spacing[24] },
  },
})

export const noticeSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  paddingTop: spacing[32],
  borderTop: `1px solid ${onDark(8)}`,
})

export const noticeTitle = style({
  margin: 0,
  fontSize: fontSize[16],
  fontWeight: fontWeight.semibold,
  color: onDark(64),
})

export const notices = style([
  list,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[6],
    fontSize: fontSize[14],
    lineHeight: 1.6,
    color: onDark(55),
    '@media': { [mobile]: { fontSize: fontSize[12] } },
  },
])
