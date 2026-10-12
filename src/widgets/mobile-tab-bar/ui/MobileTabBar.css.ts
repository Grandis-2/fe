import { keyframes, style } from '@vanilla-extract/css'

import {
  color,
  motion,
  onDark,
  spacing,
  typography,
  breakpoint,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

// 가로 스크롤 0 → 끝(320px - 화면 폭)에 맞춰 왼쪽으로 민다. 화면이 320px 이상이면
// 가로 스크롤이 없어 타임라인이 비활성이고 아무 효과가 없다. 미지원 브라우저는 제자리에 있는다.
const followScrollX = keyframes({
  to: { transform: 'translateX(calc(100vw - 320px))' },
})

export const root = style({
  position: 'fixed',
  left: spacing[16],
  right: spacing[16],
  bottom: TAB_BAR_OFFSET,
  // 바텀시트(BottomSheet.css, 30)·전체 화면 메뉴(MobileMenu.css, 30)보다 위 — 열려 있어도
  // 탭바는 보이고 다른 탭으로 바로 이동할 수 있다.
  zIndex: 31,
  // vaul(1.1.2)은 modal={false}여도 Radix Dialog를 modal로 열어 body에 pointer-events:none을
  // 건다 — 탭바는 body 아래라 이걸 상속해 클릭이 막히므로 직접 되살린다.
  pointerEvents: 'auto',
  // 좌우 16px 여백만 남기고 화면 폭을 채운다(디자인: width 100%) — 탭은 같은 폭으로 나눈다.
  boxSizing: 'border-box',
  // fixed라 body의 min-width(320px, app/styles/index.css)를 안 따르고 화면 폭으로 줄어든다 —
  // 320px 화면에서의 폭 아래로는 줄지 않게 막고, 페이지가 가로로 스크롤되면 같이 움직인다.
  minWidth: `calc(320px - ${spacing[16]} * 2)`,
  animationName: followScrollX,
  animationTimingFunction: 'linear',
  animationFillMode: 'both',
  animationTimeline: 'scroll(root inline)',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  height: TAB_BAR_HEIGHT,
  padding: spacing[6],
  borderRadius: '999px',
  // 어두운 반투명 유리 — 어떤 페이지 위에서도 같은 색이다(사용자 페이지는 어두운 방향).
  background: `color-mix(in srgb, ${color.backgroundDark.surface} 78%, transparent)`,
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: `1px solid ${onDark(8)}`,
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
  '@media': {
    [breakpoint.desktop]: { display: 'none' },
  },
})

const ACTIVE = '[aria-current="page"], [aria-expanded="true"]'

export const tab = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: 0,
  border: 'none',
  borderRadius: '999px',
  background: 'transparent',
  textDecoration: 'none',
  // 아이콘은 currentColor로 이 색을 상속한다(CLAUDE.md의 lucide-react 참고).
  color: onDark(55),
  cursor: 'pointer',
  transition: [
    `background ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    // 선택된 탭은 흰 글자 + 옅은 흰 유리 알약(안쪽 1px 테두리).
    [`&:is(${ACTIVE})`]: {
      background: onDark(12),
      boxShadow: `inset 0 0 0 1px ${onDark(8)}`,
      color: color.text.inverse,
    },
  },
})

export const icon = style({
  width: '20px',
  height: '20px',
  strokeWidth: 1.8,
  transition: `stroke-width ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    [`:is(${ACTIVE}) > &`]: { strokeWidth: 2.2 },
  },
})

export const label = style([
  // Pretendard는 typography 토큰이 갖고 있다 — 크기만 10px로 덮어쓴다.
  typography.body.caption,
  {
    whiteSpace: 'nowrap',
    fontSize: '10px',
    lineHeight: 1,
    fontWeight: fontWeight.medium,
    selectors: {
      [`:is(${ACTIVE}) > &`]: { fontWeight: fontWeight.semibold },
    },
  },
])
