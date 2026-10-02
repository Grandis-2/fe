import { globalStyle, style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

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
// 없어야 hover 영역이 끊기지 않는다. 양쪽 15px씩이라 인접 링크 사이는 기존 gap과
// 같은 30px로 유지된다. 토큰에 없는 값이라(15px) 여기 둔다.
// 헤더도 로고~첫 링크 간격을 맞추려면 이 값을 알아야 해서 내보낸다.
export const NAV_LINK_PADDING_X = '15px'

// 메가 메뉴가 열려 있는 상태를 가리키는 선택자. 메뉴는 JS 상태 없이 hover/focus로만
// 열리므로(아래 menu 스타일), 헤더도 이 선택자를 :has()로 보고 배경을 맞춘다.
// data-mega-menu는 CategoryNav.tsx의 brand 요소에 붙어 있다.
export const MEGA_MENU_OPEN = '[data-mega-menu]:is(:hover, :focus-within)'

// onDark: 헤더가 어두운 섹션 위에 있을 때(Header.tsx가 판단) 흰 글자로 그린다.
export const linksTone = styleVariants({
  default: { color: color.text.secondary },
  onDark: {
    color: color.text.inverse,
    selectors: {
      // 메뉴가 열리면 헤더가 불투명한 흰색이 되므로 평소 색으로 되돌린다.
      [`${root}:has(${MEGA_MENU_OPEN}) &`]: { color: color.text.secondary },
    },
  },
})

export const links = style([
  typography.body.defaultRegular,
  {
    display: 'flex',
    alignItems: 'center',
    // brand가 헤더 높이를 채우려면 그 부모인 이 그룹도 같이 늘어나야 한다.
    alignSelf: 'stretch',
  },
])

export const divider = style({
  padding: `0 ${NAV_LINK_PADDING_X}`,
  fontSize: '10px',
  color: color.border.default,
})

export const link = style({
  border: 'none',
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
  ].join(', '),
  selectors: {
    '&:hover': {
      color: color.primary.base,
      WebkitTextStrokeColor: 'currentColor',
    },
    // 남색 hover는 어두운 배경에서 묻히므로 흰색을 유지하고 굵기로만 반응한다.
    [`${linksTone.onDark} &:hover`]: {
      color: color.text.inverse,
      WebkitTextStrokeColor: 'currentColor',
    },
    // onDark의 hover 색은 흰색이라, 불투명해진 흰 헤더에선 글자가 사라진다.
    [`${root}:has(${MEGA_MENU_OPEN}) &:hover`]: {
      color: color.primary.base,
      WebkitTextStrokeColor: 'currentColor',
    },
  },
})

export const linkActive = style([
  typography.body.defaultMedium,
  { color: color.primary.base },
])

// 브랜드 링크 + 메가 메뉴 묶음. 헤더 높이만큼 늘려 링크와 메뉴 사이에 빈 틈이 없게 한다
// (메뉴가 이 요소의 자식이므로 메뉴 위에 있는 동안에도 :hover가 유지된다).
export const brand = style({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'stretch',
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
  padding: `${spacing[30]} 0`,
  background: color.background.base,
  borderBottom: `1px solid ${color.border.default}`,
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
  gap: spacing[40],
  padding: `0 ${spacing[40]}`,
})

// 카테고리 / 브랜드 두 묶음을 세로로 쌓는다. 남은 폭을 차지해야 타일이 오른쪽
// menuAside("더 알아보기")를 밀어내지 않고 줄바꿈한다.
export const menuGroups = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  flex: 1,
  minWidth: 0,
  // menuInner가 stretch라 두면 aside 높이만큼 늘어난다.
  alignSelf: 'flex-start',
})

export const menuGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
})

// 타일은 폭 180px 고정이고, 넘치면 다음 줄로 넘어간다. 높이도 모든 타일이 같아야
// 해서 행 높이를 썸네일 타일 내용 높이(패딩 12×2 + 썸네일 64 + gap 8 + 글자 한 줄
// ≈ 114.2px)보다 조금 큰 116px로 맞춘다 — 카테고리/브랜드가 서로 다른 그리드라 1fr로는
// 둘을 맞출 수 없고, 딱 114px면 내용 높이와 0.2px씩 어긋난다.
// (menuTile은 모바일 바텀시트도 써서 폭/높이는 타일이 아니라 이 그리드에서 정한다.)
export const menuTileGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, 180px)',
  gridAutoRows: 'minmax(116px, auto)',
  gap: spacing[16],
})

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

export const menuTileWithThumbnail = style([
  menuTile,
  {
    flexDirection: 'column',
    gap: spacing[8],
    padding: spacing[12],
  },
])

export const menuTileThumbnail = style({
  width: '64px',
  aspectRatio: '1 / 1',
  objectFit: 'contain',
})

export const menuAside = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  // 카테고리 타일은 왼쪽, "더 알아보기"는 콘텐츠 박스 오른쪽 끝으로 민다.
  marginLeft: 'auto',
  boxSizing: 'border-box',
  width: '200px',
  // 타일 쪽이 줄어들며 줄바꿈하지, 이 칸이 같이 줄어들면 안 된다.
  flexShrink: 0,
  paddingLeft: spacing[30],
  borderLeft: `1px solid ${color.border.subtle}`,
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
export const menuSectionTitle = style([
  typography.body.subMedium,
  { color: color.text.tertiary },
])

export const menuAsideLink = style([
  typography.body.sub,
  {
    color: color.text.secondary,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: `color ${motion.duration.fast} ${motion.easing.default}`,
    selectors: {
      '&:hover': { color: color.primary.base },
    },
  },
])
