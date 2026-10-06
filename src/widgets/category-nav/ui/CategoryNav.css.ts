import { globalStyle, style, styleVariants } from '@vanilla-extract/css'

import {
  color,
  motion,
  onDark,
  spacing,
  typography,
} from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  alignItems: 'center',
  // 브랜드 항목이 헤더 높이를 채워야 링크와 메뉴 사이에 커서가 빠지는 틈이 없다.
  // position은 일부러 주지 않는다 — 메뉴가 헤더(Header.css의 root)를 기준으로 잡혀야
  // 가로 전체를 차지할 수 있기 때문이다.
  alignSelf: 'stretch',
  minWidth: 0,
})

// 간격을 gap이 아니라 링크 안쪽 여백으로 준다 — 링크 사이에 커서가 빠지는 빈 틈이
// 없어야 hover 영역이 끊기지 않는다. 양쪽 14px씩이라 인접 링크 사이는 시안(Web Header)의
// 28px이 된다.
// 헤더도 로고~첫 링크 간격을 맞추려면 이 값을 알아야 해서 내보낸다.
export const NAV_LINK_PADDING_X = spacing[14]

// 메가 메뉴가 열려 있는 상태를 가리키는 선택자. 메뉴는 JS 상태 없이 hover/focus로만
// 열리므로(아래 menu 스타일), 헤더도 이 선택자를 :has()로 보고 배경을 맞춘다.
// data-mega-menu는 CategoryNav.tsx의 brand 요소에 붙어 있다.
export const MEGA_MENU_OPEN = '[data-mega-menu]:is(:hover, :focus-within)'

// onDark: 헤더가 어두운 섹션 위에 있을 때(Header.tsx가 판단) 흰 글자로 그린다.
export const linksTone = styleVariants({
  default: { color: color.text.secondary },
  onDark: {
    // 시안(Web Header): 평소 #A3A3A3, 현재·hover는 흰색.
    color: onDark(64),
  },
})

export const links = style([
  typography.body.defaultRegular,
  {
    // 시안(Web Header) 크기 — 토큰에 15px이 없어 여기 둔다.
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    // brand가 헤더 높이를 채우려면 그 부모인 이 그룹도 같이 늘어나야 한다.
    alignSelf: 'stretch',
  },
])

export const divider = style({
  flexShrink: 0,
  width: '1px',
  height: '14px',
  margin: `0 ${NAV_LINK_PADDING_X}`,
  background: onDark(18),
})

// 브랜드 링크 + 메가 메뉴 묶음. 헤더 높이만큼 늘려 링크와 메뉴 사이에 빈 틈이 없게 한다
// (메뉴가 이 요소의 자식이므로 메뉴 위에 있는 동안에도 :hover가 유지된다).
export const brand = style({
  display: 'flex',
  alignItems: 'stretch',
  alignSelf: 'stretch',
})

// 메뉴가 열린 브랜드 링크 — 흰 글자에 아래 2px 선(시안).
const linkOpen = {
  color: color.text.inverse,
  borderBottomColor: color.primary.subtle,
} as const

export const link = style({
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box',
  border: 'none',
  // 열린 메뉴 표시선 자리. 위에도 같은 두께를 줘서 글자가 세로 가운데에 남는다.
  borderTop: '2px solid transparent',
  borderBottom: '2px solid transparent',
  background: 'transparent',
  padding: `0 ${NAV_LINK_PADDING_X}`,
  font: 'inherit',
  color: 'inherit',
  textDecoration: 'none',
  // root가 minWidth: 0이라 좁은 화면에서 링크가 줄어들며 글자가 두 줄로 꺾인다.
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  // font-weight를 바꾸면 글자 폭이 늘어나 레이아웃이 흔들리므로, 실제 두께는 유지하고
  // 글자 윤곽선 전체에 얇은 stroke를 둘러 가로/세로 모두 고르게 두꺼워 보이게 한다.
  WebkitTextStrokeWidth: '0.6px',
  WebkitTextStrokeColor: 'transparent',
  transition: [
    `color ${motion.duration.fast} ${motion.easing.default}`,
    `-webkit-text-stroke-color ${motion.duration.fast} ${motion.easing.default}`,
    `border-color ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    [`${brand}:focus-within &`]: linkOpen,
    '&:hover': {
      color: color.primary.base,
      WebkitTextStrokeColor: 'currentColor',
    },
    // 남색 hover는 어두운 배경에서 묻히므로 흰색을 유지하고 굵기로만 반응한다.
    [`${linksTone.onDark} &:hover`]: {
      color: color.text.inverse,
      WebkitTextStrokeColor: 'currentColor',
    },
  },
  '@media': {
    '(hover: hover)': { selectors: { [`${brand}:hover &`]: linkOpen } },
  },
})

export const linkActive = style({
  fontWeight: fontWeight.semibold,
  color: color.primary.base,
  selectors: {
    [`${linksTone.onDark} &`]: { color: color.text.inverse },
  },
})

const menuOpen = {
  // 옆 브랜드로 옮길 때 닫히는 패널과 열리는 패널이 잠깐 겹친다(아래 주석) — 모든
  // 패널이 같은 zIndex(20)면 나중 브랜드일수록 DOM 순서상 위에 그려져, 앞쪽 브랜드로
  // 옮겨갈 때 닫히는 패널이 새로 열리는 패널을 가리고 포인터 이벤트까지 가로챈다.
  // 지금 열려 있는 패널만 더 높여서 항상 위에 오게 한다.
  zIndex: 21,
  opacity: 1,
  visibility: 'visible',
  transform: 'translateY(0)',
  // 열 때는 기다리지 않는다 — 아래 menu의 지연은 닫힐 때만 걸리게 한다.
  transitionDelay: '0s',
} as const

// 여는 데 JS 상태를 쓰지 않는다 — :hover와 :focus-within만으로 열린다.
export const menu = style({
  // 기준 박스는 헤더(Header.css의 root) — left/right 0으로 화면 가로 전체를 덮는다.
  // 100vw를 쓰면 세로 스크롤바 폭만큼 넘쳐서 가로 스크롤이 생기므로 쓰지 않는다.
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  // 헤더가 sticky가 아닌 페이지(상품 상세)의 sticky 바(z-index 2)보다 위에 오도록.
  zIndex: 20,
  // 시안(Web Header)의 어두운 패널. 바탕은 Header.css의 열린 헤더와 같은 색이다.
  padding: '36px 0 44px',
  background: `color-mix(in srgb, ${color.backgroundDark.base} 94%, transparent)`,
  borderBottom: `1px solid ${onDark(10)}`,
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
  opacity: 0,
  visibility: 'hidden',
  transform: 'translateY(-4px)',
  transition: [
    `opacity ${motion.duration.fast} ${motion.easing.default}`,
    `transform ${motion.duration.fast} ${motion.easing.default}`,
    `visibility ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  // 브랜드는 저마다 패널을 하나씩 갖고 있어서, 옆 브랜드로 옮기면 나가는 패널과
  // 들어오는 패널이 동시에 반투명해지는 구간이 생긴다 — 그 사이로 어두워진 페이지가
  // 비쳐서 번쩍여 보인다. 들어오는 쪽이 완전히 불투명해질 때까지(= 열리는 시간만큼)
  // 닫기를 미뤄 두 패널이 겹치게 하면 빈 구간 자체가 없어진다.
  // 메뉴 밖으로 아예 나갔을 때도 이만큼은 유지돼서, 살짝 스쳤을 때 닫히지 않는다.
  transitionDelay: motion.duration.fast,
  // 키보드 포커스는 기기와 무관하게 연다.
  selectors: {
    [`${brand}:focus-within &`]: menuOpen,
  },
  // hover는 hover가 되는 기기에서만 — 터치 기기는 hover가 걸려도 닫을 방법이 없다.
  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${brand}:hover &`]: menuOpen,
      },
    },
  },
})

// 메뉴가 열리면 헤더 아래 페이지를 어둡게 덮는 딤.
// 딤 요소를 헤더 안에 두면 헤더 자신의 배경까지 같이 덮여서 헤더가 회색이 된다.
// 그래서 body에 깔고 :has()로 여닫는다 — z-index 5는 페이지 콘텐츠(최대 2) 위,
// 헤더(10) 아래라서 메뉴와 헤더만 밝게 남는다.
globalStyle('body::after', {
  content: '""',
  position: 'fixed',
  inset: 0,
  zIndex: 5,
  background: `color-mix(in srgb, ${color.backgroundDark.base} 55%, transparent)`,
  // 딤이 보이는 동안에도 아래 콘텐츠를 계속 클릭할 수 있게 한다.
  pointerEvents: 'none',
  opacity: 0,
  visibility: 'hidden',
  transition: [
    `opacity ${motion.duration.fast} ${motion.easing.default}`,
    `visibility ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  // 패널과 같은 지연 — 딤만 먼저 걷히면 그것대로 번쩍인다.
  transitionDelay: motion.duration.fast,
})

globalStyle(`body:has(${brand}:focus-within)::after`, {
  opacity: 1,
  visibility: 'visible',
  transitionDelay: '0s',
})

globalStyle(`body:has(${brand}:hover)::after`, {
  '@media': {
    '(hover: hover)': {
      opacity: 1,
      visibility: 'visible',
      transitionDelay: '0s',
    },
  },
})

// 내용도 헤더 콘텐츠(Header.css의 content)처럼 뷰포트 전체 너비를 쓰고 좌우 여백만
// 맞춘다 — 로고 아래에서 타일이 시작하고, "더 알아보기"는 액션 아이콘 아래 끝에 붙는다.
export const menuInner = style({
  display: 'flex',
  alignItems: 'stretch',
  gap: '48px',
  padding: '0 48px',
})

// 카테고리 / 브랜드 두 묶음을 세로로 쌓는다. 남은 폭을 차지해야 타일이 오른쪽
// menuAside("더 알아보기")를 밀어내지 않고 줄바꿈한다.
export const menuGroups = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[32],
  flex: 1,
  minWidth: 0,
  // menuInner가 stretch라 두면 aside 높이만큼 늘어난다.
  alignSelf: 'flex-start',
})

export const menuGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[14],
})

// 타일은 폭 180px 고정이고, 넘치면 다음 줄로 넘어간다. 높이는 타일(megaTile)이 정한다.
export const menuTileGrid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[12],
})

// 데스크톱 메가 메뉴 타일(시안). 모바일 바텀시트는 아래 menuTile을 그대로 쓴다.
export const megaTile = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  width: '180px',
  height: '64px',
  borderRadius: '14px',
  border: `1px solid ${onDark(10)}`,
  background: color.backgroundDark.surface,
  color: onDark(90),
  fontSize: fontSize[16],
  fontWeight: fontWeight.semibold,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: ['border-color', 'background', 'color']
    .map((p) => `${p} ${motion.duration.fast} ${motion.easing.default}`)
    .join(', '),
  selectors: {
    // aria-current: 지금 보고 있는 하위 카테고리(CategoryNav.tsx가 URL로 판단).
    '&:hover, &[aria-current="page"]': {
      borderColor: color.primary.base,
      background: `color-mix(in srgb, ${color.primary.base} 8%, ${color.backgroundDark.surface})`,
      color: color.text.inverse,
    },
  },
})

export const megaTileWithThumbnail = style([
  megaTile,
  {
    flexDirection: 'column',
    gap: spacing[14],
    height: '148px',
    fontSize: '15px',
  },
])

export const menuTile = style([
  typography.body.subMedium,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '96px',
    padding: `${spacing[20]} ${spacing[16]}`,
    background: color.background.surface,
    color: color.text.secondary,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: [
      `background ${motion.duration.fast} ${motion.easing.default}`,
      `color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      // aria-current: 지금 보고 있는 하위 카테고리(CategoryNav.tsx가 URL로 판단).
      '&:hover, &[aria-current="page"]': {
        background: color.primary.subtler,
        color: color.primary.base,
      },
    },
  },
])

export const menuTileThumbnail = style({
  width: '88px',
  height: '64px',
  objectFit: 'contain',
})

export const menuAside = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  // 카테고리 타일은 왼쪽, "더 알아보기"는 콘텐츠 박스 오른쪽 끝으로 민다.
  marginLeft: 'auto',
  boxSizing: 'border-box',
  width: '260px',
  // 타일 쪽이 줄어들며 줄바꿈하지, 이 칸이 같이 줄어들면 안 된다.
  flexShrink: 0,
  paddingLeft: spacing[32],
  borderLeft: `1px solid ${onDark(10)}`,
})

// --- MobileCategoryNav (바텀시트 안) ---

export const mobileRoot = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  overflowY: 'auto',
})

// 이벤트 배너와 브랜드 섹션 사이 구분 제목. 시트 제목(메뉴)보다 한 단계 작게.
export const mobileHeading = style([
  typography.title.mdSemibold,
  { color: color.text.primary },
])

export const mobileSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

export const mobileBrand = style([
  typography.body.defaultMedium,
  { color: color.text.primary, textDecoration: 'none' },
])

export const mobileBrands = style({
  display: 'flex',
  gap: spacing[8],
})

export const mobileBrandChip = style([
  typography.body.subMedium,
  {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[12],
    background: color.background.surface,
    color: color.text.secondary,
    textDecoration: 'none',
    selectors: {
      '&:hover': {
        background: color.primary.subtler,
        color: color.primary.base,
      },
    },
  },
])

export const mobileCategories = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: spacing[8],
})

export const mobileCategoryTile = style([
  typography.body.subMedium,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[8],
    padding: spacing[12],
    background: color.background.surface,
    color: color.text.secondary,
    textDecoration: 'none',
    selectors: {
      '&:hover, &[aria-current="page"]': {
        background: color.primary.subtler,
        color: color.primary.base,
      },
    },
  },
])

export const mobileCategoryThumbnail = style({
  width: '100%',
  aspectRatio: '1 / 1',
  objectFit: 'contain',
})

// 시트 맨 위 이벤트 배너. 상품 카테고리와 성격이 달라 목록과 떼어 위에 둔다.
export const mobileEventBanner = style([
  typography.body.defaultMedium,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[16],
    background: color.primary.subtler,
    color: color.primary.base,
    textDecoration: 'none',
    transition: `background ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { background: color.primary.subtlerHover },
    },
  },
])

// 메가 메뉴의 소제목 — 카테고리/브랜드 묶음과 "더 알아보기"가 같이 쓴다.
export const menuSectionTitle = style({
  fontSize: '13px',
  fontWeight: fontWeight.semibold,
  letterSpacing: '0.02em',
  color: onDark(55),
  selectors: { [`${menuAside} > &`]: { marginBottom: spacing[8] } },
})

export const menuAsideLink = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '40px',
  fontSize: '15px',
  color: onDark(90),
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { color: color.primary.subtle },
  },
})

export const menuAsideArrow = style({
  width: '16px',
  height: '16px',
  color: onDark(55),
})
