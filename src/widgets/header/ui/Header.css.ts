import { createVar, globalStyle, style } from '@vanilla-extract/css'

import {
  color,
  motion,
  onDark as onDarkMix,
  spacing,
  typography,
  breakpoint,
} from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'
// Header가 CategoryNav를 소유한다(CLAUDE.md) — 메가 메뉴 열림 선택자와 링크 padding은
// 한 곳(CategoryNav.css)의 값을 그대로 쓴다.
import { MEGA_MENU_OPEN, NAV_LINK_PADDING_X } from '@widgets/category-nav'

import { DARK_HEADER_PADDING_X } from '../model/layout'

import { panel as notificationPanel } from './HeaderNotification/HeaderNotification.css'

import type { StyleRule } from '@vanilla-extract/css'

// 헤더 높이는 breakpoint마다 달라서 숫자 상수 대신 :root의 CSS 변수로 둔다 —
// 헤더 밖(MainPage 배너 끌어올리기, MainLayout minHeight)에서도 같은 값을 읽어야 해서
// 헤더 요소가 아니라 :root에 건다. calc() 안에서 그대로 쓰면 된다.
export const headerHeight = createVar()

// 시안의 어두운 헤더·메가 메뉴 바탕(rgba(10,11,13,.94)).
const darkSurface = `color-mix(in srgb, ${color.backgroundDark.base} 94%, transparent)`

globalStyle(':root', {
  vars: { [headerHeight]: '68px' },
  '@media': {
    [breakpoint.mobile]: { vars: { [headerHeight]: '52px' } },
  },
})

// 헤더는 뒤를 blur한다. 어드민은 투명 바탕에 기본색 글자, 그 외는 어두운 헤더(onDark)다.
export const root = style({
  width: '100%',
  boxSizing: 'border-box',
  // CategoryNav의 메가 메뉴가 화면 가로 전체를 잡을 수 있게 헤더를 기준 박스로 만든다.
  // sticky 페이지에선 아래 sticky가 덮어쓰고, 나머지는 이 기본값을 쓴다.
  position: 'relative',
  background: 'transparent',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  transition: `background-color ${motion.duration.fast} ${motion.easing.default}`,
  // 메뉴가 닫힐 때 패널·딤과 같은 지연으로 움직여야 한다(CategoryNav.css) — 헤더만
  // 먼저 투명해지면 아직 떠 있는 흰 패널이 헤더에서 떨어져 나온 것처럼 보인다.
  transitionDelay: motion.duration.fast,
  selectors: {
    // 메뉴가 열리면 패널(CategoryNav.css의 menu)이 헤더 바로 밑에 붙는다 — 패널과 같은
    // 바탕으로 바꿔 한 덩어리로 보이게 한다.
    [`&:has(${MEGA_MENU_OPEN})`]: {
      // sticky가 아닌 페이지는 z-index가 없어서 메뉴의 딤(body::after, z-index 5)이
      // 헤더 위에 얹힌다.
      zIndex: 10,
      background: darkSurface,
      transitionDelay: '0s',
    },
    // 알림 패널도 메가 메뉴처럼 헤더 밑으로 내려오므로 페이지 위에 올린다.
    [`&:has(${notificationPanel})`]: { zIndex: 10 },
  },
})

// 어드민을 뺀 모든 헤더(시안 Web Header). 자식 요소들이 이 클래스를 보고 흰색으로 바뀐다.
// 아래 선은 border가 아니라 inset 그림자 — 두께가 없어 헤더가 정확히 headerHeight라
// 메인처럼 배너를 헤더 밑으로 끌어올리는 페이지도 1px 틈이 안 생긴다.
export const onDark = style({
  boxShadow: `inset 0 -1px 0 ${onDarkMix(8)}`,
})

// 뒤가 밝은 구간이면 흰 글자가 묻히므로 어두운 반투명 바탕을 깐다(blur는 root 그대로).
// 어두운 구간(data-header-theme="dark") 위에선 투명하게 둔다 — Header.tsx가 판단한다.
export const solid = style({ background: darkSurface })

// 어드민 헤더 — 시안 이전 디자인을 그대로 둔다. 자식 요소들이 이 클래스를 보고 크기를 되돌린다.
export const admin = style({
  borderBottom: `1px solid ${color.border.default}`,
})
// 시안(Web Header)의 크기는 데스크톱 일반 헤더에만 — 모바일과 어드민은 원래 크기 그대로다.
const webOnly = (rules: StyleRule) => ({
  [breakpoint.desktop]: { selectors: { [`${onDark} &`]: rules } },
})

// 바(root)와 콘텐츠(로고/nav/액션) 모두 뷰포트 전체 너비를 쓴다 — 넓은 화면에서도
// 로고는 왼쪽 끝, 액션은 오른쪽 끝에 붙는다.
export const content = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxSizing: 'border-box',
  width: '100%',
  height: headerHeight,
  margin: '0 auto',
  padding: `0 ${spacing[40]}`,
  '@media': {
    [breakpoint.mobile]: { padding: `0 ${spacing[12]}` },
    [breakpoint.desktop]: {
      selectors: {
        [`${onDark} &`]: { padding: `0 ${DARK_HEADER_PADDING_X}` },
        // headerHeight(68px)는 시안 기준이라 어드민만 원래 높이로 되돌린다.
        [`${admin} &`]: { height: '63px' },
      },
    },
  },
})

// 모바일(<744px)에선 CategoryNav 대신 하단 탭바(MobileTabBar)의 카테고리 시트를 쓴다.
// '&&'로 명시도를 두 배로 — CategoryNav root의 display를 스타일시트 로드 순서와
// 무관하게 이긴다.
export const desktopOnly = style({
  '@media': {
    [breakpoint.mobile]: { selectors: { '&&': { display: 'none' } } },
  },
})

// 메인페이지에서만 헤더가 sticky다(Header.tsx의 isStickyPage). 그 외 페이지는
// root의 기본 position: relative를 그대로 쓴다 — 상품 상세엔 자체 sticky
// 주문바/탭바가 있어 겹치면 안 되고, 마이페이지는 스크롤에 안 따라오게 한다.
export const sticky = style({
  position: 'sticky',
  top: 0,
  zIndex: 10,
})

export const leftGroup = style({
  display: 'flex',
  alignItems: 'center',
  // CategoryNav의 메가 메뉴가 헤더 바닥 기준으로 열릴 수 있도록 헤더 높이를 그대로 넘겨준다.
  alignSelf: 'stretch',
  // nav 링크가 자체 좌우 padding을 갖고 있어 그만큼 빼야 로고~첫 글자가 시안의 40px이 된다.
  gap: `calc(40px - ${NAV_LINK_PADDING_X})`,
})

export const logo = style([
  typography.logo.wordmark,
  {
    height: 'fit-content',
    // Michroma는 줄 상자 위쪽 여백이 커서 글자가 아래로 처진다 — 대문자 높이만 남기고 잘라
    // 헤더의 세로 가운데 정렬이 글자 기준이 되게 한다(미지원 브라우저는 기존 그대로).
    textBox: 'trim-both cap alphabetic',
    fontSize: fontSize[20],
    color: color.primary.base,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[18] },
      ...webOnly({ fontSize: '22px' }),
    },
    selectors: {
      [`${onDark} &`]: { color: color.text.inverse },
    },
  },
])

export const logoMember = style({
  // eslint-disable-next-line no-restricted-syntax -- 그라데이션 중간 색, 대응 토큰 없음
  backgroundImage: `linear-gradient(90deg, ${color.primary.focus}, #55428c, ${color.secondary.subtle})`,
  backgroundClip: 'text',
  color: 'transparent',
})

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  // 버튼이 height:100%로 헤더 높이를 채우려면 이 묶음부터 늘어나야 한다
  // (content가 alignItems:center라 기본은 내용 높이만큼만 잡힌다).
  alignSelf: 'stretch',
  gap: spacing[20],
  '@media': {
    [breakpoint.mobile]: { gap: spacing[12] },
    ...webOnly({ gap: spacing[4] }),
  },
})

export const iconButton = style({
  display: 'inline-flex',
  // 버튼이 헤더 높이를 꽉 채우고, 아이콘은 그 안에서 가운데 정렬된다.
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  // 아이콘은 currentColor로 이 색을 상속한다(CLAUDE.md의 lucide-react 참고).
  // 색 규칙은 CategoryNav의 link와 똑같이 맞춘다 — 평소 회색(어두운 배경에선 흰색),
  // hover하면 남색(어두운 배경에선 흰색 유지). CategoryNav.css.ts를 고치면 여기도 같이.
  color: color.text.secondary,
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { color: color.primary.base },
    [`${onDark} &`]: { color: color.text.inverse },
    [`${onDark} &:hover`]: { color: color.text.inverse },
  },
  // 시안: 40px 칸 가운데에 아이콘. 칸끼리는 actions의 gap(4px)만 띄운다.
  '@media': webOnly({ minWidth: '40px' }),
})

// 버튼을 감싼 요소(HeaderNotification)도 헤더 높이를 채워야 안의 버튼이 height:100%를 받는다.
export const fill = style({ display: 'flex', alignSelf: 'stretch' })

// 배지를 아이콘 오른쪽 위에 겹쳐 띄우는 기준 박스.
export const badgeAnchor = style({ position: 'relative' })

// 알림·장바구니 개수. 헤더 높이를 꽉 채운 버튼 안에서 아이콘 위쪽에 맞춘다.
export const countBadge = style([
  typography.body.caption,
  {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: '-20px',
    marginLeft: '4px',
    minWidth: '18px',
    height: '18px',
    padding: `0 ${spacing[4]}`,
    boxSizing: 'border-box',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color.primary.base,
    color: color.text.inverse,
    fontSize: '11px',
    lineHeight: 1,
    '@media': {
      // 모바일 아이콘(20px)이 작아진 만큼 배지도 줄인다.
      [breakpoint.mobile]: {
        marginTop: '-14px',
        marginLeft: '1px',
        minWidth: '14px',
        height: '14px',
        padding: `0 ${spacing[3]}`,
        borderRadius: '7px',
        fontSize: '9px',
        fontWeight: 700,
      },
      ...webOnly({
        marginTop: '-16px',
        marginLeft: '1px',
        minWidth: '16px',
        height: '16px',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: 700,
      }),
    },
  },
])

// 구매 확정 대기 — 해야 할 일이라 노란 경고색. 밝은 바탕이라 글자는 어둡게.
export const countBadgeWarning = style({
  background: color.status.warning,
  color: color.backgroundDark.base,
})

export const icon = style({
  width: '24px',
  height: '24px',
  // 링크가 hover 때 글자 윤곽선으로 두꺼워지는 것에 맞춰 아이콘도 선을 굵게 한다.
  // CSS stroke-width가 lucide의 stroke-width 속성(2)보다 우선한다.
  strokeWidth: 2,
  transition: `stroke-width ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    [`${iconButton}:hover &`]: { strokeWidth: 2.5 },
  },
  '@media': {
    [breakpoint.mobile]: { width: '20px', height: '20px' },
    [breakpoint.desktop]: {
      selectors: {
        [`${onDark} &`]: { width: '22px', height: '22px', strokeWidth: 1.8 },
        [`${onDark} ${iconButton}:hover &`]: { strokeWidth: 2.3 },
      },
    },
  },
})
