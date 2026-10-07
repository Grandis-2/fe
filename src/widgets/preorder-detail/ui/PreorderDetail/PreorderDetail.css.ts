import { style, styleVariants } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  onDark,
  primaryGlow,
  primaryGradient,
  spacing,
  statusOnDark,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@shared/config/theme'
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} from '@shared/config/theme/tokens/typography/base'

// 어두운 사전예약 페이지 전용 — 테마와 상관없이 흰 글자(onDark)를 쓴다.
const mobile = breakpoint.mobile

export const root = style({
  color: color.text.inverse,
  fontFamily: fontFamily.pretendard,
  lineHeight: lineHeight[140],
})

export const intro = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  '@media': { [mobile]: { gap: spacing[8] } },
})

export const back = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[2],
  alignSelf: 'flex-start',
  fontSize: fontSize[14],
  color: onDark(64),
  textDecoration: 'none',
  selectors: { '&:hover': { color: color.text.inverse } },
})

export const badges = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[10],
  '@media': { [mobile]: { gap: spacing[8] } },
})

const badgeBase = style({
  padding: `3px ${spacing[8]}`,
  borderRadius: '6px',
  fontSize: fontSize[12],
  fontWeight: fontWeight.semibold,
})

export const statusBadge = styleVariants({
  live: [
    badgeBase,
    {
      background: `color-mix(in srgb, ${statusOnDark.success} 14%, transparent)`,
      color: statusOnDark.success,
    },
  ],
  soon: [
    badgeBase,
    {
      background: `color-mix(in srgb, ${color.primary.subtle} 16%, transparent)`,
      color: color.primary.subtle,
    },
  ],
  done: [badgeBase, { background: onDark(8), color: onDark(64) }],
})

const ddayBase = style({
  fontSize: fontSize[14],
  fontWeight: fontWeight.bold,
  '@media': { [mobile]: { fontSize: fontSize[12] } },
})

export const dday = styleVariants({
  live: [ddayBase],
  soon: [ddayBase, { color: color.primary.subtle }],
  done: [ddayBase],
})

export const title = style({
  margin: 0,
  fontSize: fontSize[32],
  fontWeight: fontWeight.bold,
  lineHeight: 1.3,
  letterSpacing: '-0.01em',
  textWrap: 'pretty',
  '@media': { [mobile]: { fontSize: fontSize[24], lineHeight: 1.35 } },
})

export const period = style({
  fontSize: fontSize[16],
  color: onDark(64),
  '@media': { [mobile]: { fontSize: fontSize[14] } },
})

export const hero = style({
  position: 'relative',
  marginTop: spacing[32],
  height: '520px',
  borderRadius: '20px',
  overflow: 'hidden',
  background: color.backgroundDark.surface,
  border: `1px solid ${onDark(10)}`,
  '@media': {
    [mobile]: {
      marginTop: spacing[20],
      height: 'auto',
      aspectRatio: '4 / 5',
      borderRadius: '16px',
    },
  },
})

const heroImageBase = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
})

// 마감이면 사진을 흐리게 깔고 가운데에 마감 안내를 얹는다.
export const heroImage = styleVariants({
  normal: [heroImageBase],
  dimmed: [heroImageBase, { opacity: 0.45 }],
})

export const closedNotice = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  padding: `${spacing[12]} ${spacing[24]}`,
  borderRadius: '12px',
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(8px)',
  fontSize: fontSize[20],
  fontWeight: fontWeight.bold,
  color: onDark(90),
  whiteSpace: 'nowrap',
  '@media': {
    [mobile]: {
      fontSize: fontSize[16],
      padding: `${spacing[10]} ${spacing[16]}`,
    },
  },
})

export const sections = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '72px',
  padding: `72px 0 ${spacing[24]}`,
  '@media': { [mobile]: { gap: '48px', padding: `48px 0 ${spacing[16]}` } },
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  '@media': { [mobile]: { gap: spacing[14] } },
})

const sectionTitleBase = style({
  margin: 0,
  fontSize: fontSize[24],
  fontWeight: fontWeight.bold,
  '@media': { [mobile]: { fontSize: fontSize[18] } },
})

export const sectionTitle = styleVariants({
  normal: [sectionTitleBase],
  muted: [sectionTitleBase, { color: onDark(64) }],
})

export const ended = style({
  fontSize: fontSize[14],
  fontWeight: fontWeight.medium,
  color: onDark(55),
})

const list = style({ margin: 0, padding: 0, listStyle: 'none' })

// 웹 3열, 모바일은 세로로 쌓는다.
export const benefits = style([
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

export const benefit = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[10],
  padding: '28px',
  borderRadius: '16px',
  background: `color-mix(in srgb, ${color.backgroundDark.surface} 80%, transparent)`,
  border: `1px solid ${onDark(10)}`,
  '@media': {
    [mobile]: { gap: spacing[6], padding: spacing[20], borderRadius: '14px' },
  },
})

export const benefitNumber = style({
  fontSize: fontSize[14],
  fontWeight: fontWeight.bold,
  color: color.primary.subtle,
})

export const benefitTitle = style({
  fontSize: fontSize[20],
  fontWeight: fontWeight.bold,
  '@media': { [mobile]: { fontSize: fontSize[16] } },
})

export const benefitDescription = style({
  fontSize: fontSize[16],
  lineHeight: lineHeight[150],
  color: onDark(64),
  '@media': { [mobile]: { fontSize: fontSize[14] } },
})

// 웹은 가로 3칸(위 굵은 선), 모바일은 세로 목록(아래 얇은 선).
export const schedule = style([
  list,
  {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    borderTop: `1px solid ${onDark(10)}`,
    '@media': {
      [mobile]: { display: 'flex', flexDirection: 'column', borderTop: 'none' },
    },
  },
])

const stepBase = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  marginTop: '-1px',
  padding: `${spacing[24]} ${spacing[24]} 0 0`,
  borderTop: `2px solid ${onDark(10)}`,
  '@media': {
    [mobile]: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '52px',
      marginTop: 0,
      padding: 0,
      borderTop: 'none',
      borderBottom: `1px solid ${onDark(8)}`,
    },
  },
})

export const step = styleVariants({
  current: [
    stepBase,
    {
      borderTopColor: color.primary.subtle,
      color: color.primary.subtle,
    },
  ],
  rest: [stepBase, { color: onDark(64) }],
})

export const stepLabel = style({
  fontSize: fontSize[14],
  fontWeight: fontWeight.semibold,
})

export const stepDate = style({
  fontSize: fontSize[20],
  fontWeight: fontWeight.bold,
  fontVariantNumeric: 'tabular-nums',
  color: color.text.inverse,
  '@media': { [mobile]: { fontSize: fontSize[14] } },
})

export const noticeSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
  '@media': { [mobile]: { gap: spacing[10] } },
})

export const noticeTitle = style({
  margin: 0,
  fontSize: fontSize[18],
  fontWeight: fontWeight.bold,
  color: onDark(90),
  '@media': { [mobile]: { fontSize: fontSize[16] } },
})

export const notices = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  margin: 0,
  paddingLeft: '18px',
  fontSize: fontSize[14],
  lineHeight: 1.6,
  color: onDark(55),
  '@media': { [mobile]: { fontSize: fontSize[12] } },
})

// 위쪽 padding 구간에서만 투명→불투명으로 바뀐다 — 그 아래(카운트다운·안내 문구·버튼)는
// 불투명이라 뒤 본문 글자와 겹쳐 보이지 않는다.
const bottomBarFade = (fade: string) =>
  `linear-gradient(to bottom, transparent, ${color.backgroundDark.base} ${fade})`

// 화면 아래에 붙는 버튼 영역 — 위로 갈수록 투명해져 본문이 자연스럽게 가려진다.
export const bottomBar = style({
  position: 'sticky',
  bottom: 0,
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: `${spacing[40]} 0 ${spacing[24]}`,
  background: bottomBarFade(spacing[40]),
  '@media': {
    [mobile]: {
      // 바탕을 떠 있는 탭바 뒤까지 깔아, 버튼과 탭바 사이로 본문이 비치지 않게 한다.
      padding: `28px 0 calc(${spacing[12]} + ${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET})`,
      background: bottomBarFade('28px'),
    },
  },
})

export const countdown = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing[10],
  marginBottom: spacing[16],
  '@media': { [mobile]: { marginBottom: spacing[12] } },
})

export const countdownLabel = style({
  fontSize: fontSize[14],
  color: onDark(64),
})

export const countdownTime = style({
  fontSize: '28px',
  fontWeight: fontWeight.bold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.01em',
  '@media': { [mobile]: { fontSize: fontSize[24] } },
})

export const countdownUnit = style({
  margin: `0 ${spacing[6]} 0 ${spacing[2]}`,
  fontSize: fontSize[14],
  fontWeight: fontWeight.medium,
  color: onDark(64),
})

export const bottomNotice = style({
  marginBottom: spacing[14],
  fontSize: fontSize[14],
  color: onDark(64),
  textAlign: 'center',
})

// 회원가입 '가입 완료' 버튼(SignupForm submit)과 같은 모습.
// Button의 hover 배경(primary.focus)을 같은 선택자로 덮어 그라데이션을 유지한다.
export const cta = style({
  width: '100%',
  height: '54px',
  border: 'none',
  borderRadius: '14px',
  background: primaryGradient,
  boxShadow: primaryGlow,
  fontSize: fontSize[16],
  fontWeight: fontWeight.bold,
  selectors: {
    '&:hover:not(:disabled)': { background: primaryGradient },
  },
})
