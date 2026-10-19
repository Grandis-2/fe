import { style } from '@vanilla-extract/css'

import {
  breakpoint,
  color,
  motion,
  spacing,
  typography,
} from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'
import { headerHeight } from '@widgets/header'

const brandTint = (percent: number) =>
  `color-mix(in srgb, ${color.primary.subtle} ${percent}%, transparent)`

// 넓은 화면에선 220px 세로 메뉴가 스크롤을 따라온다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  minWidth: 0,
  '@media': {
    [breakpoint.desktop]: {
      flex: '0 0 220px',
      position: 'sticky',
      top: `calc(${headerHeight} + ${spacing[24]})`,
    },
  },
})

export const profile = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[14],
})

export const avatar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: brandTint(16),
  color: color.primary.subtle,
})

export const profileTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
  minWidth: 0,
})

export const userName = style([
  typography.body.defaultMedium,
  { fontSize: '17px', fontWeight: fontWeight.bold },
])

export const email = style([
  typography.body.sub,
  {
    overflow: 'hidden',
    color: color.text.tertiary,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
])

// 좁은 화면에선 가로 밑줄 탭 — 넘치면 옆으로 스크롤한다. 바닥선은 inset 그림자로
// 그려 선택된 탭의 밑줄(역시 inset)이 그 위에 겹쳐 보이게 한다.
export const nav = style({
  display: 'flex',
  gap: spacing[4],
  overflowX: 'auto',
  scrollbarWidth: 'none',
  '@media': {
    [breakpoint.desktop]: { flexDirection: 'column', overflowX: 'visible' },
    // Container 좌우 패딩(모바일 16px) 안에서 스크롤하면 탭이 화면 끝 전에 잘려 보인다 —
    // 패딩만큼 밖으로 넓히고 같은 만큼 안쪽 여백을 줘, 글자 자리는 그대로 두고 화면 끝까지 스크롤되게 한다.
    [breakpoint.mobile]: {
      gap: 0,
      marginInline: `calc(-1 * ${spacing[16]})`,
      paddingInline: spacing[16],
      boxShadow: `inset 0 -1px 0 ${color.border.subtle}`,
    },
  },
})

export const link = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    height: '44px',
    padding: `0 ${spacing[14]}`,
    border: 'none',
    borderRadius: '10px',
    background: 'transparent',
    color: color.text.tertiary,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: [
      `background-color ${motion.duration.fast} ${motion.easing.default}`,
      `color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover': {
        background: color.background.surface,
        color: color.text.primary,
      },
      // 지금 보고 있는 탭 — 굵기는 transition하지 않는다(폭이 흔들림).
      '&[aria-current="page"], &[aria-current="page"]:hover': {
        background: brandTint(16),
        color: color.text.primary,
        fontWeight: fontWeight.bold,
      },
    },
    '@media': {
      [breakpoint.mobile]: {
        padding: `0 ${spacing[12]}`,
        borderRadius: 0,
        selectors: {
          '&:hover': { background: 'transparent' },
          '&[aria-current="page"], &[aria-current="page"]:hover': {
            background: 'transparent',
            boxShadow: `inset 0 -2px 0 ${color.primary.subtle}`,
          },
        },
      },
    },
  },
])

// 구매 확정 대기 숫자 — 해야 할 일이라 헤더 마이페이지 아이콘 배지와 같은 경고색.
export const badge = style([
  typography.body.caption,
  {
    minWidth: '18px',
    height: '18px',
    marginLeft: spacing[6],
    padding: `0 ${spacing[4]}`,
    boxSizing: 'border-box',
    borderRadius: '9px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color.status.warning,
    color: color.backgroundDark.base,
    fontWeight: fontWeight.bold,
  },
])

// 프로필 줄 오른쪽 끝의 아이콘 버튼.
export const logout = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '36px',
  height: '36px',
  marginLeft: 'auto',
  border: 'none',
  borderRadius: '50%',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: [
    `background-color ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:hover:not(:disabled)': {
      background: color.background.surface,
      color: color.text.primary,
    },
    // 로그아웃 요청 중 — 두 번 보내지 않게 막는다.
    '&:disabled': { cursor: 'progress', opacity: 0.5 },
  },
})
