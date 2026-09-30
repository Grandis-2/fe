import {
  createVar,
  globalStyle,
  style,
  styleVariants,
} from '@vanilla-extract/css'

import {
  color,
  motion,
  spacing,
  typography,
  breakpoint,
} from '@/shared/config/theme'
import { fontSize } from '@/shared/config/theme/tokens/typography/base'
// Header가 CategoryNav를 소유한다(CLAUDE.md) — 메가 메뉴 열림 선택자와 링크 padding은
// 한 곳(CategoryNav.css)의 값을 그대로 쓴다.
import { MEGA_MENU_OPEN, NAV_LINK_PADDING_X } from '@/widgets/category-nav'

// 헤더 높이는 breakpoint마다 달라서 숫자 상수 대신 :root의 CSS 변수로 둔다 —
// 헤더 밖(MainPage 배너 끌어올리기, MainLayout minHeight)에서도 같은 값을 읽어야 해서
// 헤더 요소가 아니라 :root에 건다. calc() 안에서 그대로 쓰면 된다.
export const headerHeight = createVar()

globalStyle(':root', {
  vars: { [headerHeight]: '63px' },
  '@media': {
    [breakpoint.mobile]: { vars: { [headerHeight]: '52px' } },
  },
})

// 헤더는 항상 배경이 투명하고 뒤를 blur한다. 글자색은 뒤 섹션이 어두우면 흰색
// (onDark), 밝으면 기본색이다 — Header.tsx가 판단해 onDark를 붙인다.
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
    // 메뉴가 열리면 흰 패널이 헤더 바로 밑에 붙는다 — 이때만 불투명한 흰 헤더로
    // 바꿔 패널과 한 덩어리로 보이게 한다.
    [`&:has(${MEGA_MENU_OPEN})`]: {
      // sticky가 아닌 페이지는 z-index가 없어서 메뉴의 딤(body::after, z-index 5)이
      // 헤더 위에 얹힌다.
      zIndex: 10,
      background: color.background.base,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      transitionDelay: '0s',
    },
  },
})

// 헤더 뒤가 어두운 섹션일 때 붙는 표시. 자식 요소들이 이 클래스를 보고 흰색으로 바뀐다.
export const onDark = style({})

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

// 페이지마다 고정이라 토글되지 않는다. hidden은 두께도 없애 헤더를 정확히
// headerHeight로 맞춘다 — 메인은 그만큼 배너를 끌어올려 헤더 밑에 겹친다(MainPage.css).
export const border = styleVariants({
  visible: { borderBottom: `1px solid ${color.border.default}` },
  hidden: { borderBottom: 'none' },
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
  // nav 링크가 자체 좌우 padding 15px를 갖고 있어, 여기에 15를 더해야 로고~첫 링크가
  // 링크 사이 간격(30px)과 같아진다.
  gap: NAV_LINK_PADDING_X,
})

export const logo = style([
  typography.logo.wordmark,
  {
    height: 'fit-content',
    fontSize: fontSize[20],
    color: color.primary.base,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    '@media': {
      [breakpoint.mobile]: { fontSize: fontSize[18] },
    },
    selectors: {
      [`${onDark} &`]: { color: color.text.inverse },
      // 메뉴가 열리면 헤더가 흰색이 되므로 어두운 섹션 위라도 기본색으로 돌아간다.
      [`${root}:has(${MEGA_MENU_OPEN}) &`]: { color: color.primary.base },
    },
  },
])

export const logoMember = style({
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
  },
})

export const iconButton = style({
  display: 'inline-flex',
  // 버튼이 헤더 높이를 꽉 채우고, 아이콘은 그 안에서 가운데 정렬된다.
  height: '100%',
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
    [`${root}:has(${MEGA_MENU_OPEN}) &`]: { color: color.text.secondary },
    [`${root}:has(${MEGA_MENU_OPEN}) &:hover`]: { color: color.primary.base },
  },
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
  },
})
