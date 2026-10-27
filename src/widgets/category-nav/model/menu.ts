import { DRAW_PATH, PREORDER_PATH } from '@shared/config/routes'

export type CategoryNavLink = '사전예약' | 'LUCKY'

// 메가 메뉴·모바일 바텀시트 카테고리 타일에 쓰는 썸네일. public/images/menu에 있는 이미지만 쓴다
// (이미지가 없는 카테고리는 기존 텍스트 타일 그대로 둔다).
// 메가 메뉴는 숨겨 둔 채 모든 페이지에 그려져 열지 않아도 받는다 — 표시 크기(88×64)의 3배 안으로
// 줄인 WebP를 둔다(원본 PNG 750px 11장 1.4MB → 47KB).
export const categoryThumbnails: Record<string, string> = {
  스마트폰: '/images/menu/mobile_smartphone.webp',
  태블릿: '/images/menu/mobile_tablet.webp',
  폴더블: '/images/menu/mobile_foldable.webp',
  노트북: '/images/menu/pc_notebook.webp',
  데스크탑: '/images/menu/pc_desktop.webp',
  모니터: '/images/menu/pc_monitor.webp',
  키보드: '/images/menu/pc_keyboard.webp',
  마우스: '/images/menu/pc_mouse.webp',
  스마트워치: '/images/menu/wearable_smartwatch.webp',
  무선이어폰: '/images/menu/wearable_earphone.webp',
  스마트밴드: '/images/menu/wearable_smartband.webp',
}

export const links: CategoryNavLink[] = ['사전예약', 'LUCKY']
export const linkPaths: Record<CategoryNavLink, string> = {
  사전예약: PREORDER_PATH,
  LUCKY: DRAW_PATH,
}
