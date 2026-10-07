import { keyframes, style } from '@vanilla-extract/css'

import {
  color,
  motion,
  spacing,
  sprinkles,
  typography,
  breakpoint,
} from '@shared/config/theme'
import { maxWidth } from '@shared/config/theme/tokens/container'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

// 한 슬라이드가 머무는 시간 = 진행 바가 차오르는 시간.
const SLIDE_DURATION = '6s'

// 좌우 배치(문구 | 이미지)는 1024px 이하에선 좁아서 모바일처럼 세로로 쌓는다.
// 헤더 높이에 맞춘 root padding만 헤더와 같은 breakpoint.mobile을 따른다.
const stacked = '(max-width: 1024px)'
const sideBySide = '(min-width: 1025px)'

export const root = style({
  // 헤더가 투명하게 위에 겹치므로(MainPage의 bannerOverlap) 헤더 높이만큼 더 비운다.
  // 위젯끼리 import하지 않는 규칙 때문에 headerHeight 변수 대신 넉넉한 고정값을 쓴다.
  padding: `163px 0 ${spacing[120]}`,
  // 어두운 바탕 위 왼쪽 위 모서리에서 primary/secondary 빛이 번지는 느낌.
  // base 두 색은 색조·밝기가 비슷해 한 덩어리로 뭉개지므로 깊은 바탕층으로만 깔고,
  // 밝은 subtle 두 색을 서로 떨어진 자리에 얹어 빛이 둘로 구분돼 보이게 한다.
  // radial-gradient 자체가 끝이 흐려서 filter: blur 없이도 부드럽게 퍼진다.
  // 위에 적은 레이어일수록 앞에 그려진다.
  background: [
    `radial-gradient(28% 38% at 8% 4%, color-mix(in srgb, ${color.secondary.subtle} 40%, transparent), transparent 70%)`,
    `radial-gradient(30% 40% at 34% 0%, color-mix(in srgb, ${color.primary.subtle} 30%, transparent), transparent 70%)`,
    `radial-gradient(55% 70% at 0% 0%, ${color.secondary.base}, transparent 72%)`,
    `radial-gradient(45% 60% at 36% 0%, color-mix(in srgb, ${color.primary.base} 85%, transparent), transparent 70%)`,
    color.backgroundDark.base,
  ].join(', '),
  color: color.text.inverse,
  '@media': {
    [breakpoint.mobile]: { padding: `100px 0 ${spacing[80]}` },
  },
})

export const inner = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[30],
  boxSizing: 'border-box',
  maxWidth: maxWidth.content,
  margin: '0 auto',
  padding: `0 ${spacing[40]}`,
  '@media': {
    [stacked]: { flexDirection: 'column-reverse', gap: spacing[24] },
  },
})

export const text = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[50],
  width: '100%',
  maxWidth: '420px',
  '@media': {
    [stacked]: { maxWidth: 'none', gap: spacing[30] },
  },
})

const fadeInKeyframes = keyframes({
  from: { opacity: 0, transform: `translateY(${spacing[8]})` },
  to: { opacity: 1, transform: 'translateY(0)' },
})

export const fadeIn = style({
  animation: `${fadeInKeyframes} 500ms ${motion.easing.out}`,
})

export const title = style([
  typography.title.xxlSemibold,
  {
    display: 'block',
    marginTop: spacing[16],
    color: 'inherit',
    // 슬라이드 문구의 \n을 그대로 줄바꿈으로 쓴다.
    whiteSpace: 'pre-line',
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[24] },
      [sideBySide]: { fontSize: '40px' },
    },
  },
])

export const description = style([
  typography.title.smMedium,
  {
    marginTop: spacing[24],
    whiteSpace: 'pre-line',
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[14] },
    },
  },
])

// Tag는 breakpoint별 size prop을 받지 않으므로, 모바일/데스크톱용 Tag를 각각 렌더링해
// 이 클래스로 번갈아 숨긴다.
export const badgeMobile = sprinkles({
  display: { mobile: 'inline-flex', desktop: 'none' },
})

export const badgeDesktop = sprinkles({
  display: { mobile: 'none', desktop: 'inline-flex' },
})

export const tabs = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
})

export const tab = style([
  typography.body.subMedium,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing[12],
    padding: 0,
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    color: color.text.tertiary,
    cursor: 'pointer',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover, &[aria-pressed="true"]': { color: color.text.inverse },
    },
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[12] },
    },
  },
])

export const tabLabel = style({ whiteSpace: 'pre-line' })

// 탭 세 칸의 트랙이 간격 없이 이어져 하나의 진행 바처럼 보인다 — 지난 탭은 꽉 채우고,
// 지금 탭만 0 → 100%로 차오른다.
export const progressTrack = style({
  alignSelf: 'stretch',
  height: '3px',
  marginBottom: spacing[12],
  background: `color-mix(in srgb, ${color.text.inverse} 20%, transparent)`,
})

const fillStyle = {
  display: 'block',
  height: '100%',
  background: color.primary.subtle,
} as const

export const progressFull = style(fillStyle)

const progressKeyframes = keyframes({
  from: { width: 0 },
  to: { width: '100%' },
})

export const progressRunning = style([
  fillStyle,
  {
    animation: `${progressKeyframes} ${SLIDE_DURATION} linear forwards`,
    // 모션을 줄인 사용자에겐 자동으로 넘기지 않는다 — 애니메이션이 없으면 끝나는
    // 이벤트도 없어서 탭을 눌러야만 넘어간다.
    '@media': {
      '(prefers-reduced-motion: reduce)': { animation: 'none', width: '100%' },
    },
  },
])

export const visual = style({
  flex: '0 1 560px',
  width: '100%',
  // 맥북 이미지(718×460) 비율에 맞춘다 — 가로로 긴 banner1.png는 이 틀로 휴대폰
  // 부분만 잘라 보인다(아래 objectPosition).
  aspectRatio: '718 / 460',
  '@media': {
    // 세로로 쌓이면 flex-basis 560px이 높이로 먹으므로 풀어 주고, 대신 폭을 같은
    // 560px로 묶는다 — 안 그러면 태블릿 폭에선 이미지가 화면을 꽉 채워 문구가 밀려난다.
    [stacked]: { flex: 'none', maxWidth: '560px' },
  },
})

export const image = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: '70% 50%',
  // banner1.png는 불투명한 짙은 남색 바탕이라 사각형 경계가 보인다 — 가장자리를
  // 흐려 배경 빛과 섞이게 한다(투명 PNG인 맥북 이미지엔 영향 없음).
  // maskImage: 'radial-gradient(closest-side, black 70%, transparent)',
  // WebkitMaskImage: 'radial-gradient(closest-side, black 70%, transparent)',
})
