export type CategoryNavLink = '이벤트' | '사전예약'

export type MenuLink = { label: string; to: string }

export type BrandMenu = {
  categories: string[]
  // 제조사 필터(텍스트 타일). 메가 메뉴에선 카테고리 아래 "브랜드" 묶음으로 따로 보인다.
  brands?: string[]
  more: MenuLink[]
}

// 브랜드에 hover/focus하면 열리는 메가 메뉴의 내용.
// 카테고리 API가 붙으면 이 상수 대신 응답을 쓴다(썸네일도 그때 같이 붙인다).
export const brandMenus: Record<string, BrandMenu> = {
  모바일: {
    categories: ['스마트폰', '태블릿', '폴더블'],
    brands: ['Apple', 'Samsung'],
    more: [
      { label: '사전예약 중인 모바일', to: '/preorder' },
      { label: '모바일 구매후기', to: '/reviews' },
    ],
  },
  'PC/주변기기': {
    categories: ['노트북', '데스크탑', '모니터', '키보드', '마우스'],
    brands: ['Apple', 'Samsung', 'LG'],
    more: [
      { label: '사전예약 중인 PC', to: '/preorder' },
      { label: 'PC 구매후기', to: '/reviews' },
    ],
  },
  웨어러블: {
    categories: ['스마트워치', '무선이어폰', '스마트밴드'],
    brands: ['Apple', 'Samsung'],
    more: [
      { label: '사전예약 중인 웨어러블', to: '/preorder' },
      { label: '웨어러블 구매후기', to: '/reviews' },
    ],
  },
} satisfies Record<string, BrandMenu>

// 메가 메뉴·모바일 바텀시트 카테고리 타일에 쓰는 썸네일. public/images/menu에 있는 이미지만 쓴다
// (이미지가 없는 카테고리는 기존 텍스트 타일 그대로 둔다).
export const categoryThumbnails: Record<string, string> = {
  스마트폰: '/images/menu/mobile_smartphone.png',
  태블릿: '/images/menu/mobile_tablet.png',
  폴더블: '/images/menu/mobile_foldable.png',
  노트북: '/images/menu/pc_notebook.png',
  데스크탑: '/images/menu/pc_desktop.png',
  모니터: '/images/menu/pc_monitor.png',
  키보드: '/images/menu/pc_keyboard.png',
  마우스: '/images/menu/pc_mouse.png',
  스마트워치: '/images/menu/wearable_smartwatch.png',
  무선이어폰: '/images/menu/wearable_earphone.png',
  스마트밴드: '/images/menu/wearable_smartband.png',
}

export const links: CategoryNavLink[] = ['이벤트', '사전예약']
export const linkPaths: Record<CategoryNavLink, string> = {
  이벤트: '/events',
  사전예약: '/preorder',
}

// URLSearchParams가 인코딩까지 해주므로 쿼리를 손으로 붙이지 않는다.
export const searchPath = (params: Record<string, string>) =>
  `/search?${new URLSearchParams(params)}`
